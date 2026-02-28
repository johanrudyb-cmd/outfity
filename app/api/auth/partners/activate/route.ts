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

        // 1. Trouver l'affilié via le token
        const affiliate = await prisma.affiliate.findUnique({
            where: { invitationToken: token },
            include: { user: true }
        });

        if (!affiliate || !affiliate.user) {
            return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });
        }

        if (affiliate.status === 'ACTIVE') {
            return NextResponse.json({ error: 'Ce compte est déjà activé.' }, { status: 400 });
        }

        // 2. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Activation atomique
        const userId = affiliate.userId as string;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                    emailVerified: new Date(), // On considère l'email vérifié puisqu'il a reçu l'invite
                    onboardingCompleted: true // Pour les partenaires, on peut sauter l'onboarding standard
                }
            }),
            prisma.affiliate.update({
                where: { id: affiliate.id },
                data: {
                    status: 'ACTIVE',
                    invitationToken: null // Consomme le token
                }
            })
        ]);

        console.log(`[Partner Activation] Succès pour ${affiliate.email}`);

        return NextResponse.json({
            message: 'Compte activé avec succès !',
            email: affiliate.email
        });
    } catch (error) {
        console.error('[Partner Activation API] Erreur:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
