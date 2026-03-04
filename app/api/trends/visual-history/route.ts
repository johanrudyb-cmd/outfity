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
                image: metadata?.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjVGNUY3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOEY4RjkzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2Ugc3VwcHJpbcOpZTwvdGV4dD48L3N2Zz4=', // "Image supprimée" placeholder SVG standard si non conservée
                analysis: metadata?.analysis,
                date: item.createdAt.toISOString()
            };
        });

        return NextResponse.json({ history: items });
    } catch (error: any) {
        console.error('[VisualTrendHistory Error]:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la récupération de l\'historique' }, { status: 500 });
    }
}
