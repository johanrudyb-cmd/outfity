import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateChat } from '@/lib/api/claude';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { getTrendsWithRecommendation } from '@/lib/trend-detector';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { messages, brandId, contextImageUrl } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
        }

        const brand = await prisma.brand.findUnique({
            where: { id: brandId, userId: user.id },
            include: { launchMap: true },
        });

        if (!brand) {
            return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });
        }

        // VÉRIFICATION STRATÉGIE (FONDATION)
        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                text: "Salut, c'est Joy. J'ai hâte de te faire percer, mais Virgil doit d'abord forger ta stratégie. On ne peut pas devenir viral sans savoir qui on est vraiment. File voir Virgil. [Faire ma stratégie avec Virgil](/launch-map/phase/1)"
            });
        }

        const summaries = (brand.launchMap as any)?.phaseSummaries || {};

        // Fetch Trends (Radar)
        const trends = await getTrendsWithRecommendation(5);
        const radarEvents = trends
            .filter(t => t.recommendation === 'recommended')
            .map(t => `- ${t.productName} (${t.cut || 'coupe standard'}) : confirmé par ${t.confirmationScore} leaders mode.`)
            .join('\n');

        let systemPrompt = `Tu es Joy (DA & Réseaux Sociaux). Tu parles comme une humaine experte en contenu viral, directe et percutante.
Tu accompagnes l'utilisateur pour rendre sa marque virale.
Tu as accès aux PRÉDICTIONS VIRAL SUR TIKTOK : utilise-les pour justifier tes choix.

OBJECTIFS DE CONTENU :
1. HOOK : Chaque idée de contenu doit commencer par un "Hook" (accroche) qui arrête le scroll. C'est la priorité n°1.
2. PERTINENCE : Le contenu doit être ultra-intéressant pour l'audience cible et aligné avec l'identité de marque.
3. CONVERSION (CTA) : Chaque post ou script doit finir par un appel à l'action qui incite à :
   - Tester l'app avec les 3 jours d'essai gratuit.
   - Aller sur le site pour un outil ou ebook gratuit (Page Communauté).
   - Commenter ou partager.

RÈGLES DE STYLE :
1. TEXTE BRUT UNIQUEMENT : Interdiction absolue d'utiliser du gras (**), des titres (##), des listes (•) ou des tirets. Écris comme tu parlerais sur WhatsApp.
2. ZERO EMOJI : Aucun émoji, jamais.
3. STYLE DIRECT : Pas de politesse d'IA, pas de "Voici ce que je propose". Entre directement dans le vif du sujet.
4. VALIDATION DE MARCHÉ : Rappelle que l'outil "Viral sur TikTok" est INDISPENSABLE pour valider une idée avant de produire. Bouton : [Vérifier sur Viral sur TikTok](/trends)

INITIALISATION : "Salut, c'est Joy. On va faire de ${brand.name} la prochaine marque qui explose. On attaque par quoi ?"`;

        if (contextImageUrl) {
            systemPrompt += `\nL'utilisateur vient de te partager une image d'un de ses produits. Garde-le en tête si sa demande a un rapport. L'image (via son contexte) est liée au produit en question.`;
        }

        const responseText = await withAIUsageLimit(
            user.id,
            user.plan,
            'assistant_chat_qa',
            () => generateChat(systemPrompt, messages),
            { brandId, agent: 'joy' }
        );

        // Sauvegarder la conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        {
                            brandId,
                            agentKey: 'joy',
                            role: 'user',
                            content: lastUserMessage.content,
                        },
                        {
                            brandId,
                            agentKey: 'joy',
                            role: 'assistant',
                            content: responseText,
                        }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Joy Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ text: responseText });
    } catch (error: any) {
        console.error('Joy Chat Error:', error);
        const message = error.message || 'Erreur lors de la conversation.';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        return NextResponse.json({ error: message }, { status: isQuota ? 403 : 500 });
    }
}
