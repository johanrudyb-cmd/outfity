import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        // Trouver l'affilié
        const affiliate = await prisma.affiliate.findUnique({
            where: { referralCode: code },
            select: { id: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
        }

        // Enregistrer le clic
        // On pourrait ajouter IP/UserAgent ici si on voulait être précis
        await prisma.affiliateClick.create({
            data: {
                affiliateId: affiliate.id,
                // On pourrait extraire IP de l'en-tête x-forwarded-for
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging affiliate click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
