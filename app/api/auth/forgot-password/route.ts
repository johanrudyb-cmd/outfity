import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend-mail';
import { randomBytes } from 'crypto';
import { verifyTurnstile } from '@/lib/security';
import { getTemplates } from '@/lib/email-templates';

export async function POST(request: Request) {
    try {
        const { email, turnstileToken } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requis' }, { status: 400 });
        }

        // --- 1. CAPTCHA VERIFICATION ---
        if (process.env.NODE_ENV !== 'development' && !await verifyTurnstile(turnstileToken)) {
            return NextResponse.json({ error: 'Vérification Captcha échouée. Êtes-vous un bot ?' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Pour la sécurité, on ne dit pas si l'utilisateur existe ou non
        if (!user) {
            console.log(`[Forgot-Password] Tentative avec email non existant: ${email}`);
            return NextResponse.json({ success: true, message: 'Si l\'email existe, un lien a été envoyé' });
        }

        // Générer un token sécurisé
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 heure

        // Enregistrer le token (utiliser VerificationToken)
        await prisma.verificationToken.upsert({
            where: {
                identifier_token: {
                    identifier: email,
                    token: token,
                },
            },
            update: {
                token: token,
                expires: expires,
            },
            create: {
                identifier: email,
                token: token,
                expires: expires,
            },
        });

        // Préparer l'URL de reset
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        // Envoyer l'email via Resend avec le nouveau template premium
        await sendEmail({
            to: email,
            subject: 'OUTFITY — Réinitialisation de mot de passe',
            html: getTemplates.passwordReset(user.name || 'utilisateur OUTFITY', resetUrl),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Forgot-Password] Erreur:', error);
        return NextResponse.json({ error: 'Une erreur est survenue lors de l\'envoi' }, { status: 500 });
    }
}
