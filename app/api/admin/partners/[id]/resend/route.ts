import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIsAdmin } from '@/lib/auth-helpers';
import { randomBytes } from 'crypto';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const affiliate = await prisma.affiliate.findUnique({
            where: { id }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        // Si déjà actif, on ne renvoie rien
        if (affiliate.status === 'ACTIVE') {
            return NextResponse.json({ error: 'Partner is already active' }, { status: 400 });
        }

        // On génère un nouveau token pour être sûr
        const invitationToken = randomBytes(32).toString('hex');

        await prisma.affiliate.update({
            where: { id },
            data: { invitationToken }
        });

        // --- ENVOI DE L'EMAIL ---
        const { sendEmail } = await import('@/lib/resend-mail');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfity.fr';
        const inviteLink = `${baseUrl}/affilie/invite?token=${invitationToken}`;

        const result = await sendEmail({
            to: affiliate.email,
            subject: `✨ OUTFITY : Nouvelle relance d'invitation pour ${affiliate.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1d1d1f; border: 1px solid #f0f0f0; border-radius: 24px;">
                    <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">C'est le moment, ${affiliate.name}.</h1>
                    
                    <p style="font-size: 16px; line-height: 1.5; color: #6e6e73;">Nous avons remarqué que vous n'avez pas encore activé votre accès Partenaire OUTFITY. Votre place dans l'élite est réservée, n'attendez plus.</p>
                    
                    <div style="background: #f5f5f7; border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                        <p style="margin-bottom: 25px; font-weight: 700; font-size: 18px;">Activez votre profil maintenant.</p>
                        <a href="${inviteLink}" style="display: inline-block; background: #000; color: white; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">Rejoindre le Programme</a>
                    </div>
                    
                    <p style="font-size: 13px; color: #86868b; text-align: center;">Lien direct : <br/> <a href="${inviteLink}" style="color: #007aff;">${inviteLink}</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e5e7; margin: 40px 0;" />
                    <p style="font-size: 12px; font-weight: bold; color: #1d1d1f; text-align: center; letter-spacing: 0.2em;">L'ÉQUIPE OUTFITY</p>
                </div>
            `
        });

        if (!result.success) {
            throw new Error(result.error || "Email failed to send");
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error resending invite:', error);
        return NextResponse.json({ error: error.message || 'Resend failed' }, { status: 500 });
    }
}
