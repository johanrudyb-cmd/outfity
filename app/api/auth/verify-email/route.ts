
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

        // 3. Mettre à jour l'utilisateur comme vérifié
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
        });

        // 4. Nettoyer les tokens pour cet email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        return NextResponse.json({ success: true, message: 'Email vérifié avec succès' });
    } catch (error) {
        console.error('[Verify-Email] Erreur:', error);
        return NextResponse.json({ error: 'Une erreur est survenue lors de la vérification' }, { status: 500 });
    }
}
