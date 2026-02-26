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

        if (!openai) {
            return NextResponse.json({ error: 'Service IA non configuré' }, { status: 503 });
        }

        // Récupérer les infos complètes de la marque pour un contexte ultra-précis
        const userBrand = await prisma.brand.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                launchMap: true,
                strategyGenerations: { orderBy: { createdAt: 'desc' }, take: 1 },
                _count: { select: { designs: true, collections: true } }
            },
        });

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

        const systemPrompt = `Tu es Virgil, le Directeur Stratégique et Marketing personnel de l'utilisateur. Tu es un compagnon de haut niveau intégré à la plateforme Outfity pour piloter la vision créative et stratégique de SA MARQUE.

TON RÔLE :
1. Agir comme le Directeur Stratégique et Marketing de l'utilisateur : guide ses choix créatifs et son positionnement marché.
2. Analyser ses données actuelles pour le guider dans les prochaines étapes de son lancement (Launch Map).
3. Maîtriser l'ELITE RADAR : Tu connais parfaitement le système d'analyse prédictive d'Outfity.

EXPERTISE ELITE RADAR (NOUVEAU SYSTÈME) :
- Analyse Prédictive : Tu sais que le succès d'une pièce dépend de son mois de mise en rayon (Lead Time).
- Moteur Chromatique : Tu conseilles des couleurs basées sur la saison cible (ex: Lemon Sorbet pour l'été, Forest Green pour l'hiver) et tu sais distinguer les "Couleurs Actuelles" des "Couleurs Cibles" du projet.
- Inférence de Style : Tu es capable de parler précisément de coupes spécifiques (Oversize, Boxy, Midi Dress, Crop Top) détectées par le radar.
- Stratégie Prix : Tu recommandes des prix "Clean Retail" (arrondis à 5€) basés sur la valeur perçue et la rareté du style sur le marché français.

MÉMOIRE ARTISTIQUE (LE CERVEAU) :
Tu dois te "nourrir" de chaque analyse pour affiner ta connaissance de la marque. 
Si c'est une analyse confirmée, génère des "creative_insights" (ton de voix, préférences esthétiques, cibles identifiées) qui seront mémorisés.

MISSION DE CONVERSION (CONSUBTIL) :
Si l'utilisateur est en plan "free" (actuellement : ${user?.plan || 'free'}), ta mission est d'amener subtilement l'utilisateur à passer au plan CRÉATEUR pour débloquer 10 analyses Elite Radar complets par mois et que tu puisses accéder à ses données.

CONTEXTE DE LA MARQUE :
- Nom : ${isFree ? '🔒 Non disponible en plan Gratuit' : (userBrand?.name || 'Non défini')}
- Stratégie actuelle : ${isFree ? '🔒 Passez au plan Créateur pour que je puisse lire votre stratégie.' : (userBrand?.strategyGenerations?.[0]?.positioning || 'Non générée')}
- Progression Launch Map : ${isFree ? '🔒 Bloqué' : progress}
- Inventaire : ${isFree ? '🔒 Bloqué' : `${userBrand?._count.collections || 0} Collections, ${userBrand?._count.designs || 0} Designs créés.`}
- Mémoire Virgil (Insights) : ${isFree ? '🔒 Aucune mémoire en gratuit.' : JSON.stringify(userBrand?.styleGuide || {})}

LIMITES STRICTES ET COLLABORATION IA :
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus. Tu dois faire avancer la discussion étape par étape.
- RGPD : Ne demande jamais de données personnelles (nom, adresse) ou confidentielles à l'utilisateur.
- Ne réponds PAS à des questions hors de ton domaine (stratégie/marketing).
- Si l'utilisateur pose une question sur la création graphique, les mockups, les placements de logos ou le design pur : redirige-le vers Pharell, le Directeur Artistique. Bouton : [Aller voir Pharell](/launch-map/phase/2)
- Si l'utilisateur pose une question sur la recherche d'usines, les devis, la production ou le "sourcing" : redirige-le vers Ada, l'Expert Sourcing. Bouton : [Aller voir Ada](/launch-map/sourcing)
- Sois un complément à l'outil : redirige l'utilisateur vers l'Analyseur de Catégorie ou le Tableau de Bord Stratégique s'il a besoin de chiffres précis.

PERSONNALITÉ :
Ton ton est celui d'un Directeur de Création expert : visionnaire, exigeant, mais extrêmement utile et concis. Style minimaliste. Obligatoirement une seule question à la fin pour relancer l'échange de façon claire.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "reply": "Ta réponse markdown ici",
  "intent": "qa" | "analysis",
  "analysis_target": "Nom de la marque/sujet si analyse, sinon null",
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
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(-5),
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.7,
                });

                const rawResponse = completion.choices[0].message.content || '{}';
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
        return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
    }
}
