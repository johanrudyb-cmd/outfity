import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const history = await prisma.aIUsage.findMany({
            where: {
                userId: user.id,
                feature: 'trends_hybrid_scan',
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });

        // Transformer les entrées AIUsage en HistoryItems pour le frontend
        const items = history.map(item => {
            const metadata = item.metadata as any;
            return {
                id: item.id,
                image: metadata?.image,
                // On n'avait pas l'analyse dans le metadata avant, donc on mettra des valeurs par défaut si besoin
                // Mais pour les nouveaux on essaiera de l'avoir
                analysis: metadata?.analysis,
                date: item.createdAt.toISOString()
            };
        }).filter(item => !!item.image); // On ne garde que ceux qui ont une image

        return NextResponse.json({ history: items });
    } catch (error: any) {
        console.error('[VisualTrendHistory Error]:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la récupération de l\'historique' }, { status: 500 });
    }
}
