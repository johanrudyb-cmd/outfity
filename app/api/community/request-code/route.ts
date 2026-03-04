import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/resend-mail';
import { getTemplates } from '@/lib/email-templates';

function generateCode(): string {
    // Generates a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
    try {
        const { email, resourceId, resourceName } = await req.json();

        if (!email || !resourceId || !resourceName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if the user already requested a code for this resource
        let lead = await prisma.communityLead.findUnique({
            where: {
                email_resourceId: {
                    email,
                    resourceId
                }
            }
        });

        let code = '';

        if (lead) {
            if (lead.isUsed) {
                // Generate a new code because the previous one was used
                code = generateCode();
                while (await prisma.communityLead.findUnique({ where: { code } })) {
                    code = generateCode();
                }
                lead = await prisma.communityLead.update({
                    where: { id: lead.id },
                    data: { code, isUsed: false, usedAt: null }
                });
            } else {
                code = lead.code;
            }
        } else {
            // Generate a unique code
            code = generateCode();
            // Ensure code is unique
            while (await prisma.communityLead.findUnique({ where: { code } })) {
                code = generateCode();
            }

            lead = await prisma.communityLead.create({
                data: {
                    email,
                    resourceId,
                    code
                }
            });
        }

        // Send the email
        const emailResult = await sendEmail({
            to: email,
            subject: `Votre accès exclusif — ${resourceName}`,
            html: getTemplates.communityCode(resourceName, code)
        });

        if (!emailResult.success) {
            console.error('Failed to send community code email', emailResult.error);
            return NextResponse.json({ error: "L'envoi de l'email a échoué" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in request-code API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
