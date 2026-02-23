import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { notifyAdmin } from '@/lib/admin-notifications';

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
        const { name, email, password } = await request.json();

        console.log('[Signup] Tentative inscription pour:', email);

        if (!email || !password || !name) {
            console.log('[Signup] Champs manquants');
            return NextResponse.json(
                { error: 'Tous les champs sont obligatoires' },
                { status: 400 }
            );
        }

        // Vérifier si utilisateur existe déjà
        console.log('[Signup] Vérification existence utilisateur...');
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('[Signup] Email déjà utilisé');
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        // Hasher le mot de passe
        console.log('[Signup] Hashage du mot de passe...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer utilisateur
        console.log('[Signup] Création utilisateur...');
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                plan: 'free',
            },
        });

        console.log('[Signup] Utilisateur créé avec succès:', user.id);

        // Notification Admin
        await notifyAdmin({
            title: 'Nouvel Inscrit',
            message: `${name} (${email}) vient de créer un compte.`,
            emoji: '👋',
            type: 'signup',
            priority: 'low',
            data: { id: user.id, email: user.email, plan: user.plan }
        });

        // Déclencher le workflow n8n Onboarding (Emails J0 -> J7)
        try {
            const ONBOARDING_WEBHOOK_URL = process.env.ONBOARDING_WEBHOOK_URL || 'http://localhost:5678/webhook/outfity-onboarding';

            fetch(ONBOARDING_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan
                }),
            }).catch(e => console.error('[Signup] Erreur Webhook n8n onboarding:', e));
        } catch (e) {
            console.error('[Signup] Erreur critique déclenchement n8n:', e);
        }

        return NextResponse.json(
            { message: 'Compte créé avec succès', userId: user.id },
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
