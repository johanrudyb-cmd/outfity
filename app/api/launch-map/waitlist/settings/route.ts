import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const body = await req.json();
        const { brandId, settings } = body as {
            brandId: string;
            settings: {
                title?: string;
                description?: string;
                mockupUrl?: string;
                accentColor?: string;
                logoUrl?: string;
            };
        };

        if (!brandId) {
            return NextResponse.json({ error: 'brandId manquant' }, { status: 400 });
        }

        // Vérifier que la marque appartient à l'utilisateur
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id }
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });

        // Upsert settings in LaunchMap
        await (prisma.launchMap as any).upsert({
            where: { brandId },
            create: {
                brandId,
                waitlistSettings: settings
            },
            update: {
                waitlistSettings: settings
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Waitlist Settings Error]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) return NextResponse.json({ error: 'brandId manquant' }, { status: 400 });

        const launchMap = await (prisma.launchMap as any).findUnique({
            where: { brandId },
            select: { waitlistSettings: true }
        });

        return NextResponse.json({ settings: launchMap?.waitlistSettings || {} });

    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
