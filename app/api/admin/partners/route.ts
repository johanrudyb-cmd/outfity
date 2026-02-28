import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIsAdmin } from '@/lib/auth-helpers';
import { randomBytes } from 'crypto';

export async function GET() {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const affiliates = await prisma.affiliate.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { clicks: true, commissions: true }
                }
            }
        });

        return NextResponse.json(affiliates);
    } catch (error) {
        console.error('Error fetching affiliates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, email, commissionRate, customMessage } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Missing name or email' }, { status: 400 });
        }

        // 1. Vérifier si un profil Affilié existe déjà avec cet email
        const existingAffiliate = await prisma.affiliate.findUnique({
            where: { email }
        });

        if (existingAffiliate) {
            return NextResponse.json({ error: 'Ce partenaire est déjà enregistré (ou invité).' }, { status: 400 });
        }

        // 2. Vérifier si un Utilisateur existe déjà avec cet email
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, affiliate: true }
        });

        if (existingUser?.affiliate) {
            return NextResponse.json({ error: 'Cet utilisateur est déjà partenaire.' }, { status: 400 });
        }

        // --- CRÉATION DU COMPTE RÉSERVÉ ---
        let targetUserId = existingUser?.id;

        if (!targetUserId) {
            console.log('[Admin API] Création du compte réservé pour:', email);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    plan: 'starter',
                    password: null,
                },
                select: { id: true }
            });
            targetUserId = newUser.id;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'Impossible de créer ou récupérer le compte utilisateur.' }, { status: 500 });
        }

        // Générer un code de parrainage et un token d'invitation unique
        const baseCode = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const referralCode = `${baseCode}-${randomBytes(6).toString('hex')}`;
        const invitationToken = randomBytes(32).toString('hex');

        const affiliate = await prisma.affiliate.create({
            data: {
                name,
                email,
                referralCode,
                commissionRate: parseFloat(commissionRate) || 0.3,
                invitationToken,
                status: 'PENDING',
                userId: targetUserId,
            },
        });

        // --- ENVOI DE L'EMAIL D'INVITATION PRO ---
        let mailSent = false;
        let mailErrorMsg = '';

        try {
            const { sendEmail } = await import('@/lib/resend-mail');
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfity.fr';
            const activationLink = `${baseUrl}/partners/activate?token=${invitationToken}`;

            const result = await sendEmail({
                to: email,
                from: 'OUTFITY <send@send.outfity.fr>',
                subject: `✨ OUTFITY : Invitation Privilégiée - Programme Partenaire ${name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1d1d1f; border: 1px solid #f0f0f0; border-radius: 24px;">
                        <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">Bienvenue dans l'élite, ${name}.</h1>
                        
                        ${customMessage ? `
                        <div style="background: #eef7ff; border-left: 4px solid #007aff; padding: 20px; margin: 25px 0; border-radius: 0 16px 16px 0;">
                            <p style="margin: 0; font-size: 15px; font-style: italic; color: #007aff;">"${customMessage}"</p>
                        </div>
                        ` : ''}

                        <p style="font-size: 16px; line-height: 1.5; color: #6e6e73;">
                            Nous avons le plaisir de vous inviter à devenir officiellement Partenaire d'OUTFITY. 
                            Votre compte a été pré-créé, il vous suffit maintenant de le configurer pour commencer.
                        </p>
                        
                        <div style="background: #f5f5f7; border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                            <p style="margin-bottom: 25px; font-weight: 700; font-size: 18px;">Configurez votre accès partenaire.</p>
                            <a href="${activationLink}" style="display: inline-block; background: #000; color: white; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                                Finaliser mon Inscription
                            </a>
                        </div>

                        <p style="font-size: 13px; color: #86868b; text-align: center;">Si le bouton ne fonctionne pas : <br/> <a href="${activationLink}" style="color: #007aff;">${activationLink}</a></p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e5e7; margin: 40px 0;" />
                        <p style="font-size: 12px; font-weight: bold; color: #1d1d1f; text-align: center; letter-spacing: 0.2em;">L'ÉQUIPE OUTFITY STRATEGY</p>
                    </div>
                `
            });

            if (result.success) {
                mailSent = true;
                console.log('[Admin API] Invitation email sent successfully to:', email);
            } else {
                mailErrorMsg = result.error || 'Erreur inconnue';
                console.error('[Admin API] Resend rejected the email:', result.error);
            }
        } catch (mailError: any) {
            mailErrorMsg = mailError.message;
            console.error('[Admin API] Connection error when sending email:', mailError);
        }

        return NextResponse.json({
            ...affiliate,
            mailSent,
            mailError: mailSent ? null : mailErrorMsg
        });
    } catch (error: any) {
        console.error('Error creating affiliate:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Cet email ou ce code existe déjà.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
