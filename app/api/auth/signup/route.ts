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
    console.log('[Signup] Requete recue !');
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
        const { name, email, password, plan = 'starter' } = await request.json();

        console.log('[Signup] Tentative inscription pour:', email);

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Tous les champs sont obligatoires' },
                { status: 400 }
            );
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

        // --- 5. EMAIL VERIFICATION & PENDING DATA ---
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 heures

        // Nettoyer les anciennes tentatives pour cet email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        // On ne crée pas l'utilisateur maintenant, on stocke ses infos dans le token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires: verificationExpires,
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    affiliateId: referrerId,
                    plan: plan || 'starter'
                } as any
            } as any // Cast for now until prisma generate fix
        });

        // Déterminer l'URL de base intelligemment
        const host = request.headers.get('host') || 'outfity.fr';
        const protocol = host.includes('localhost') ? 'http' : 'https';

        // On évite d'utiliser NEXTAUTH_URL si on détecte qu'on est sur le domaine de prod
        // mais que la variable pointe encore sur localhost
        let baseUrl = process.env.NEXTAUTH_URL;
        if (!baseUrl || (baseUrl.includes('localhost') && !host.includes('localhost'))) {
            baseUrl = `${protocol}://${host}`;
        }

        const verificationUrl = `${baseUrl.replace(/\/$/, '')}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        console.log('[Signup] Verification Link:', verificationUrl);

        // Notification Admin
        await notifyAdmin({
            title: 'Tentative de création de compte',
            message: `${name} (${email}) demande à rejoindre OUTFITY (Plan: ${plan}).`,
            emoji: '🟡',
            type: 'signup',
            priority: 'low',
            data: { email }
        });

        const result = await sendEmail({
            to: email,
            subject: 'OUTFITY — Active ton accès',
            html: getTemplates.emailVerification(name, verificationUrl),
        });

        if (!result.success) {
            console.error('[Signup] Email verification failed to send:', result.error);
            // On retourne quand même un 201 mais avec une info sur l'erreur mail pour le debug
            return NextResponse.json(
                {
                    message: 'Compte en attente, mais l\'email n\'a pas pu être envoyé.',
                    debugError: result.error,
                    verificationUrl // On le donne en debug pour que l'utilisateur puisse continuer
                },
                { status: 201 }
            );
        }


        return NextResponse.json(
            { message: 'Lien de validation envoyé. Veuillez vérifier votre email.' },
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
