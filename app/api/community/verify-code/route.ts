import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { code, resourceId } = await req.json();

        if (!code || !resourceId) {
            return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
        }

        const lead = await prisma.communityLead.findUnique({
            where: { code }
        });

        if (!lead) {
            return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 404 });
        }

        if (lead.resourceId !== resourceId) {
            return NextResponse.json({ valid: false, error: "Ce code n'est pas pour cette ressource." }, { status: 403 });
        }

        // Mark as used
        if (lead.isUsed) {
            return NextResponse.json({ valid: false, error: "Ce code a déjà été utilisé. Veuillez redemander un code avec votre email." }, { status: 403 });
        }

        await prisma.communityLead.update({
            where: { id: lead.id },
            data: { isUsed: true, usedAt: new Date() }
        });

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Error in verify-code API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
