import { NextResponse } from 'next/server';
import { analyzeVisualTrend } from '@/lib/api/chatgpt';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { image } = await req.json();
        if (!image) {
            return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
        }

        // 1. Analyse IA Vision avec vérification manuelle de quota
        const { checkAIUsageLimit, recordAIUsage } = await import('@/lib/ai-usage');
        const { allowed, message } = await checkAIUsageLimit(user.id, user.plan || 'free', 'trends_hybrid_scan');

        if (!allowed) {
            return NextResponse.json({ error: message || 'Quota IA épuisé' }, { status: 403 });
        }

        let resultAnalysis;
        try {
            resultAnalysis = await analyzeVisualTrend(image);
        } catch (aiError: any) {
            if (aiError?.code === 'NOT_CLOTHING' || aiError?.message?.startsWith('NOT_CLOTHING:')) {
                const detectedObject = aiError.reason || aiError.message?.replace('NOT_CLOTHING:', '') || 'objet inconnu';
                return NextResponse.json({
                    error: 'NOT_CLOTHING',
                    message: `Le Scanner IVS analyse uniquement des vêtements. Objet détecté : ${detectedObject}.`,
                    detectedObject,
                }, { status: 422 });
            }
            throw aiError;
        }

        // 2. Recherche de correspondances dans la base de données
        const keywords = [...resultAnalysis.tags, resultAnalysis.category, resultAnalysis.style];
        const matches = await prisma.trendProduct.findMany({
            where: {
                OR: [
                    ...keywords.map(k => ({ name: { contains: k, mode: 'insensitive' as const } })),
                    ...keywords.map(k => ({ category: { contains: k, mode: 'insensitive' as const } })),
                    ...keywords.map(k => ({ style: { contains: k, mode: 'insensitive' as const } }))
                ]
            },
            take: 4,
            orderBy: { trendScore: 'desc' }
        });

        // 3. Score final
        const dbBoost = matches.length > 0
            ? (matches.reduce((acc, m) => acc + m.trendScore, 0) / matches.length / 100) * 20
            : 0;
        const finalScore = Math.min(100, Math.round(resultAnalysis.baseTrendScore + dbBoost));

        const finalAnalysis = {
            ...resultAnalysis,
            trendScore: finalScore,
            dbMatches: matches
        };

        // 4. Enregistrement de l'utilisation avec TOUTES les métadonnées pour l'historique
        const usageId = await recordAIUsage(user.id, 'trends_hybrid_scan', {
            image: image.length < 500000 ? image : undefined, // On garde l'image si pas trop lourde
            analysis: finalAnalysis,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            analysis: finalAnalysis,
            id: usageId
        });

    } catch (error: any) {
        console.error('[VisualTrend Error]:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de l\'analyse' }, { status: 500 });
    }
}
