import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
        }

        // 1. Trouver l'affilié par son token (doit être relié à un utilisateur sans mdp)
        const affiliate = await prisma.affiliate.findUnique({
            where: { invitationToken: token },
            include: { user: true }
        });

        if (!affiliate || !affiliate.user) {
            return NextResponse.json({ error: 'L\'invitation est invalide ou a déjà été utilisée' }, { status: 404 });
        }

        // 2. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Validation atomique : Mettre à jour l'utilisateur et activer l'affilié
        const userId = affiliate.userId as string;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            }),
            prisma.affiliate.update({
                where: { id: affiliate.id },
                data: {
                    status: 'ACTIVE',
                    invitationToken: null
                }
            })
        ]);

        console.log('[Activation] Compte partenaire activé avec succès:', affiliate.email);

        // Envoyer le signal n8n optionnel ici si nécessaire
        const ONBOARDING_WEBHOOK_URL = process.env.ONBOARDING_WEBHOOK_URL;
        if (ONBOARDING_WEBHOOK_URL) {
            try {
                await fetch(ONBOARDING_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        email: affiliate.email,
                        name: affiliate.name,
                        plan: 'starter',
                        isAffiliate: true
                    }),
                });
            } catch (e) {
                console.error('[Activation] Erreur n8n (non bloquante):', e);
            }
        }

        return NextResponse.json({
            message: 'Votre compte a été activé. Vous pouvez maintenant vous connecter.',
            email: affiliate.email
        });
    } catch (error) {
        console.error('[Activation API] Erreur:', error);
        return NextResponse.json({ error: 'Une erreur est survenue lors de l\'activation' }, { status: 500 });
    }
}
