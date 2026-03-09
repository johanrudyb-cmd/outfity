import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { code, resourceId } = await req.json();

        if (!code || !resourceId) {
            return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
        }

        // STATIC TIKTOK CODES
        const staticCodes: Record<string, string[]> = {
            'joy-scripts': ['TIKTOK10', 'JOYVIRAL', 'OUTFITYJOY'],
            'pharrell-techpack': ['TECHPACKPRO', 'DESIGNMASTER', 'OUTFITYPRO'],
            'ada-sourcing': ['ADAFACTORY', 'SOURCING100', 'OUTFITYADA'],
        };

        const codeUpper = code.toUpperCase().trim();
        const validStaticCodes = staticCodes[resourceId] || [];

        if (validStaticCodes.includes(codeUpper)) {
            return NextResponse.json({ valid: true, type: 'static_tiktok' });
        }

        // DYNAMIC CODES (from communityLead)
        const lead = await prisma.communityLead.findUnique({
            where: { code }
        });

        if (!lead) {
            return NextResponse.json({ valid: false, error: 'Code invalide ou introuvable' }, { status: 404 });
        }

        if (lead.resourceId !== resourceId) {
            return NextResponse.json({ valid: false, error: "Ce code n'est pas pour cette ressource." }, { status: 403 });
        }

        // We can optionally not enforce isUsed if we want multiple downloads,
        // but let's keep it for dynamic unique codes for now.
        if (lead.isUsed) {
            return NextResponse.json({ valid: false, error: "Ce code a déjà été utilisé." }, { status: 403 });
        }

        await prisma.communityLead.update({
            where: { id: lead.id },
            data: { isUsed: true, usedAt: new Date() }
        });

        return NextResponse.json({ valid: true, type: 'dynamic_lead' });
    } catch (error) {
        console.error('Error in verify-code API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
