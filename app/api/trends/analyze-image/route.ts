import { NextResponse } from 'next/server';
import { analyzeVisualTrend } from '@/lib/api/chatgpt';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { withAIUsageLimit } from '@/lib/ai-usage';

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

        // 1. Analyse IA Vision avec limite de quota
        let resultAnalysis;
        try {
            resultAnalysis = await withAIUsageLimit(
                user.id,
                user.plan || 'free',
                'trends_hybrid_scan',
                () => analyzeVisualTrend(image)
            );
        } catch (aiError: any) {
            // Gestion spécifique : image non-vêtement détectée par l'IA
            if (aiError?.code === 'NOT_CLOTHING' || aiError?.message?.startsWith('NOT_CLOTHING:')) {
                const detectedObject = aiError.reason || aiError.message?.replace('NOT_CLOTHING:', '') || 'objet inconnu';
                return NextResponse.json({
                    error: 'NOT_CLOTHING',
                    message: `Le Scanner IVS analyse uniquement des vêtements. Objet détecté : ${detectedObject}. Uploadez une photo de t-shirt, pantalon, robe, veste ou autre vêtement.`,
                    detectedObject,
                }, { status: 422 });
            }
            throw aiError; // Re-throw pour le catch global
        }

        // 2. Recherche de correspondances dans la base de données
        const keywords = [...resultAnalysis.tags, resultAnalysis.category, resultAnalysis.style];

        const matches = await prisma.trendProduct.findMany({
            where: {
                OR: [
                    ...keywords.map(k => ({
                        name: { contains: k, mode: 'insensitive' as const }
                    })),
                    ...keywords.map(k => ({
                        category: { contains: k, mode: 'insensitive' as const }
                    })),
                    ...keywords.map(k => ({
                        style: { contains: k, mode: 'insensitive' as const }
                    }))
                ]
            },
            take: 4,
            orderBy: { trendScore: 'desc' }
        });

        // 3. Calcul du Trend Score final basé sur l'IA et la DB
        let dbBoost = 0;
        if (matches.length > 0) {
            const avgDbScore = matches.reduce((acc: number, m: any) => acc + m.trendScore, 0) / matches.length;
            dbBoost = (avgDbScore / 100) * 20;
        }

        const finalScore = Math.min(100, Math.round(resultAnalysis.baseTrendScore + dbBoost));

        return NextResponse.json({
            analysis: {
                ...resultAnalysis,
                trendScore: finalScore,
                dbMatches: matches
            }
        });

    } catch (error: any) {
        console.error('[VisualTrend Error]:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de l\'analyse' }, { status: 500 });
    }
}

