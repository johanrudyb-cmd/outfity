
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { token, email } = await request.json();

        if (!token || !email) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
        }

        // 1. Trouver le token dans la DB
        const verificationToken = await prisma.verificationToken.findUnique({
            where: {
                identifier_token: {
                    identifier: email,
                    token: token,
                },
            },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Token invalide ou inexistant' }, { status: 400 });
        }

        // 2. Vérifier l'expiration
        if (new Date() > verificationToken.expires) {
            // Supprimer le token expiré
            await prisma.verificationToken.delete({
                where: {
                    token: token,
                },
            });
            return NextResponse.json({ error: 'Le lien a expiré.' }, { status: 400 });
        }

        // 3. Récupérer les données d'inscription stockées dans le token
        const signupData = verificationToken.data as any;
        if (!signupData) {
            return NextResponse.json({ error: 'Données d\'inscription introuvables' }, { status: 400 });
        }

        // 4. Créer l'utilisateur (on vérifie d'abord s'il ne s'est pas déjà créé via un autre onglet/lien)
        const existingConfirm = await prisma.user.findUnique({ where: { email } });
        if (existingConfirm) {
            // Déjà créé et validé
            return NextResponse.json({ success: true, message: 'Compte déjà activé' });
        }

        const user = await prisma.user.create({
            data: {
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                affiliateId: signupData.affiliateId,
                plan: signupData.plan || 'starter',
                emailVerified: new Date(),
            },
        });

        console.log('[Verify-Email] Utilisateur créé et activé:', user.id);

        // 5. Déclencher le workflow n8n Onboarding (Le "mail d'inscription" arrive après validation)
        try {
            const ONBOARDING_WEBHOOK_URL = process.env.ONBOARDING_WEBHOOK_URL;
            if (ONBOARDING_WEBHOOK_URL) {
                await fetch(ONBOARDING_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        event: 'signup_confirmed'
                    }),
                });
            }
        } catch (e) {
            console.error('[Verify-Email] Erreur n8n:', e);
        }

        // 4. On garde les tokens un court instant pour l'auto-login client
        /*
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });
        */

        return NextResponse.json({ success: true, message: 'Email vérifié avec succès' });
    } catch (error) {
        console.error('[Verify-Email] Erreur:', error);
        return NextResponse.json({ error: 'Une erreur est survenue lors de la vérification' }, { status: 500 });
    }
}
