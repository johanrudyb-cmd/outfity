import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { notifyAdmin } from '@/lib/admin-notifications';
import { verifyTurnstile, validatePasswordStrength } from '@/lib/security';
import { getTemplates } from '@/lib/email-templates';
import { sendEmail } from '@/lib/resend-mail';
import { randomBytes } from 'crypto';

// --- In-Memory Rate Limiter basique ---
// En production sur plusieurs serveurs (ex: Vercel Edge), il vaut mieux utiliser Upstash/Redis.
// Mais pour un MVP ou un déploiement unique, cette Map en mémoire filtre 99% des bots basiques.
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_IP = 5;       // Max 5 inscriptions par minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

export async function POST(request: Request) {
    try {
        // --- 1. RATE LIMITING ---
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const now = Date.now();
        const limitData = ipRequests.get(ip);

        if (limitData) {
            if (now > limitData.resetTime) {
                // Le temps est écoulé, on reset le compteur
                ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
            } else if (limitData.count >= MAX_REQUESTS_PER_IP) {
                // Trop de requêtes
                console.warn(`[Security] Blocage Rate Limit Inscription (IP: ${ip})`);
                return NextResponse.json(
                    { error: 'Trop de tentatives inscripton. Veuillez patienter une minute.' },
                    { status: 429 } // 429 Too Many Requests
                );
            } else {
                // On incrémente
                limitData.count++;
                ipRequests.set(ip, limitData);
            }
        } else {
            // Première requête
            ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }

        // --- Nettoyage périodique simple pour éviter les fuites de mémoire (très basique) ---
        if (ipRequests.size > 10000) {
            ipRequests.clear();
            console.log('[Security] Vidage manuel du cache de Rate Limiting.');
        }

        // --- 2. TRAITEMENT NORMAL ---
        const { name, email, password, turnstileToken } = await request.json();

        console.log('[Signup] Tentative inscription pour:', email);

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Tous les champs sont obligatoires' },
                { status: 400 }
            );
        }

        // --- 3. CAPTCHA VERIFICATION ---
        if (process.env.NODE_ENV !== 'development' && !await verifyTurnstile(turnstileToken)) {
            return NextResponse.json({ error: 'Vérification Captcha échouée.' }, { status: 403 });
        }

        // --- 4. PASSWORD ROBUSTNESS ---
        const passCheck = validatePasswordStrength(password);
        if (!passCheck.isValid) {
            return NextResponse.json({ error: passCheck.error }, { status: 400 });
        }

        // Vérifier si utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé. Connectez-vous.' },
                { status: 400 }
            );
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- 3. GESTION DE L'AFFILIATION ---
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const refCode = cookieStore.get('outfity_ref')?.value;
        let referrerId = null;

        if (refCode) {
            const affiliate = await prisma.affiliate.findUnique({
                where: { referralCode: refCode },
                select: { id: true }
            });
            if (affiliate) {
                referrerId = affiliate.id;
                console.log(`[Signup] Affiliate referral detected: ${refCode} (ID: ${referrerId})`);
            }
        }

        // Créer utilisateur
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                plan: 'starter',
                affiliateId: referrerId,
            },
        });

        console.log('[Signup] Utilisateur créé avec succès:', user.id);

        // Notification Admin
        await notifyAdmin({
            title: 'Nouvel Inscrit (En attente confirmation)',
            message: `${name} (${email}) vient de créer un compte.`,
            emoji: '📩',
            type: 'signup',
            priority: 'low',
            data: { id: user.id, email: user.email, plan: user.plan }
        });

        // --- 5. EMAIL VERIFICATION ---
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 heures

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires: verificationExpires,
            }
        });

        const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        await sendEmail({
            to: email,
            subject: 'OUTFITY — Confirme ton inscription',
            html: getTemplates.emailVerification(name, verificationUrl),
        });

        // Déclencher le workflow n8n Onboarding (Emails J0 -> J7)
        try {
            const ONBOARDING_WEBHOOK_URL = process.env.ONBOARDING_WEBHOOK_URL || 'http://localhost:5678/webhook/outfity-onboarding';

            console.log('[Signup] Appel Webhook n8n:', ONBOARDING_WEBHOOK_URL);

            await fetch(ONBOARDING_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan
                }),
            });
            console.log('[Signup] Signal n8n envoyé avec succès.');
        } catch (e) {
            console.error('[Signup] Erreur déclenchement n8n:', e instanceof Error ? e.message : String(e));
        }

        return NextResponse.json(
            { message: 'Compte créé. Veuillez vérifier votre email pour l\'activer.', userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error('[Signup] Erreur lors inscription:', error);
        console.error('[Signup] Type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('[Signup] Message:', error instanceof Error ? error.message : String(error));

        return NextResponse.json(
            {
                error: 'Une erreur est survenue lors de inscription',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}
