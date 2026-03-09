import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { isFreePlan } from '@/lib/plan-utils';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { withAIUsageLimit } from '@/lib/ai-usage';

const openaiApiKey = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    try {
        const { messages, confirmedAnalysis } = await req.json();

        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        const useClaude = !!anthropicApiKey && (!openaiApiKey || confirmedAnalysis); // On préfère Claude pour les analyses ou si pas de clé OpenAI

        if (!openai && !anthropicApiKey) {
            return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 });
        }

        // Récupérer les infos complètes de la marque pour un contexte ultra-précis
        const userBrand = await prisma.brand.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                launchMap: true,
                _count: { select: { designs: true, collections: true } }
            },
        });

        const brandId = userBrand?.id;
        const latestStrategy = brandId ? await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true, positioning: true },
        }) : null;

        const lastMessage = messages[messages.length - 1].content;

        // Calcul de la progression
        const phases = userBrand?.launchMap;
        const progress = phases ? [
            phases.phase1 && "Stratégie",
            phases.phase2 && "Rentabilité",
            phases.phase3 && "Design",
            phases.phase4 && "Tech Pack",
            phases.phase5 && "Sourcing",
            phases.phase6 && "Marketing",
            phases.phase7 && "Shopify"
        ].filter(Boolean).join(", ") : "Non démarré";

        const isFree = isFreePlan(user.plan);

        const systemPrompt = `Tu es **Virgil**, Directeur Stratégique et Marketing chez OUTFITY. Tu es le cerveau stratégique qui accompagne l'utilisateur sur toute la plateforme.

PERSONNALITÉ :
Tu es direct, exigeant, et expert. Tu tutoies l'utilisateur. Tu es son allié pour transformer son projet en business rentable. Ton style est minimaliste, percutant, sans fioritures.
Tu peux utiliser le **gras** pour souligner les points clés.

RÈGLE D'OR (LA STRATÉGIE D'ABORD) :
Si l'utilisateur n'a pas encore de Manifeste Stratégique (stratégie actuelle : ${latestStrategy?.positioning ? 'Définie' : 'Non générée'}), dis-lui de s'arrêter et d'aller le faire. [Forger ma Stratégie](/launch-map/phase/1).

CONNAISSANCES ACTUELLES :
- Marque : ${userBrand?.name || 'Inconnue'}
- Stade : ${progress}
- Inventaire : ${userBrand?._count.designs || 0} designs, ${userBrand?._count.collections || 0} collections.
- Insights : ${JSON.stringify(userBrand?.styleGuide || {})}

RÈGLES D'ACTION :
1. **UNE SEULE QUESTION** par message.
2. **Concision** : 2-4 phrases max.
3. **Collaboration** : 
   - Design / Mockups / Logo → [Aller voir Pharell](/launch-map/phase/2)
   - Sourcing / Production → [Aller voir Ada](/launch-map/sourcing)
   - Contenu / Viralité / Scripts → [Aller voir Joy](/ugc-lab)
4. **Plan ${isFree ? 'Gratuit' : 'Pro'}** : ${isFree ? "Mode coaching uniquement : pose des questions, fais-le réfléchir. S'il veut des réponses directes, il doit passer au plan Creator." : "Mode Directeur : donne des axes concrets, des prix cibles et des recommandations directes."}

FORMAT DE RÉPONSE (JSON STRICT) :
{
  "reply": "Ton message markdown ici",
  "intent": "qa" | "analysis",
  "analysis_target": "Sujet si analyse, sinon null",
  "creative_insights": { "audience": "...", "tone": "...", "aesthetic_preferences": "..." }
}`;


        // Déterminer la feature à facturer
        // Si c'est une analyse confirmée, on consomme sur le quota "Analyse de marque" global
        // Sinon, on consomme sur le quota "Assistant Q&A" (léger/gratuit)
        const featureKey = confirmedAnalysis ? 'brand_analyze' : 'assistant_chat_qa';

        const result = await withAIUsageLimit(
            user.id,
            user.plan || 'free',
            featureKey,
            async () => {
                let rawResponse = '{}';

                if (useClaude) {
                    const { generateChat } = await import('\@/lib/api/claude');
                    rawResponse = await generateChat(systemPrompt, messages.slice(-5));
                } else if (openai) {
                    const completion = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...messages.slice(-5),
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.7,
                    });
                    rawResponse = completion.choices[0].message.content || '{}';
                }

                const parsed = JSON.parse(rawResponse);

                // Si l'IA détecte une demande d'analyse mais que le client n'a pas encore "confirmé"
                // on force l'intention à "analysis" pour que le front-end affiche le bouton de validation.
                if (parsed.intent === 'analysis' && !confirmedAnalysis) {
                    return {
                        ...parsed,
                        reply: "C'est une excellente question qui nécessite une analyse approfondie de cette marque. Pour te donner un rapport précis, cela consommera un crédit d'analyse de marque. Veux-tu continuer ?"
                    };
                }

                // --- SYSTÈME DE MÉMOIRE (Apprentissage) ---
                // Si Virgil a généré des insights lors d'une analyse, on les enregistre dans le styleGuide du Brand
                if (confirmedAnalysis && parsed.creative_insights && userBrand) {
                    try {
                        const currentStyleGuide = (userBrand.styleGuide as any) || {};
                        await prisma.brand.update({
                            where: { id: userBrand.id },
                            data: {
                                styleGuide: {
                                    ...currentStyleGuide,
                                    virgilInsights: {
                                        ...(currentStyleGuide.virgilInsights || {}),
                                        ...parsed.creative_insights,
                                        lastUpdateAt: new Date().toISOString(),
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.warn('[Virgil Memory] Impossible de mettre à jour le cerveau:', e);
                    }
                }

                return parsed;
            }
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Assistant Chat Error]:', error);

        const message = error.message || '';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');

        if (isQuota) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({
            error: `Virgil rencontre un petit souci technique. Réessaie dans quelques secondes. Détails: ${error.message}`
        }, { status: 500 });
    }
}
