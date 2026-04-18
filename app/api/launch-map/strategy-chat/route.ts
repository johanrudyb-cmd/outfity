import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { generateChat } from '@/lib/api/chatgpt';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { success } = await rateLimitByUser(currentUser.id, 'strategy-chat', {
            maxRequests: 20,
            windowMs: 60000,
        });
        if (!success) {
            return NextResponse.json({ error: 'Trop de requêtes, veuillez patienter un instant.' }, { status: 429 });
        }

        const body = await req.json();
        const { brandId, messages } = body as {
            brandId: string;
            messages: { role: 'user' | 'assistant'; content: string }[];
            context?: { brandName?: string; productType?: string };
        };

        if (!brandId || !messages?.length) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: {
                launchMap: true,
                designs: { where: { productImageUrl: { not: null } }, take: 3, orderBy: { createdAt: 'desc' } },
                _count: { select: { designs: true, waitlistLeads: true } }
            },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true, templateBrandName: true, positioning: true, targetAudience: true },
        });

        const isPro = ['creator', 'pro', 'enterprise', 'admin'].includes(currentUser.plan || '');
        const hasStrategy = !!latestStrategy?.strategyText;
        const designCount = brand._count.designs;
        const leadCount = brand._count.waitlistLeads;
        const phasesCompleted = [
            brand.launchMap?.phase1, brand.launchMap?.phase2, brand.launchMap?.phase3,
            brand.launchMap?.phase4, brand.launchMap?.phase5
        ].filter(Boolean).length;

        const userStage = !hasStrategy ? 'debutant'
            : designCount === 0 ? 'strategie_ok'
                : leadCount === 0 ? 'design_ok'
                    : 'en_lancement';

        const brandContext = [
            `Marque : ${brand.name}`,
            latestStrategy?.positioning ? `Positionnement : ${latestStrategy.positioning}` : null,
            latestStrategy?.targetAudience ? `Cible : ${latestStrategy.targetAudience}` : null,
            latestStrategy?.templateBrandName ? `Inspiration : ${latestStrategy.templateBrandName}` : null,
            `Designs créés : ${designCount}`,
            `Leads waitlist : ${leadCount}`,
            `Phases complétées : ${phasesCompleted}/5`,
            latestStrategy?.strategyText ? `\nManifeste :\n${latestStrategy.strategyText.slice(0, 2000)}` : null,
        ].filter(Boolean).join('\n');

        const introScripts: Record<string, string> = {
            debutant: `Aucune stratégie générée. Aide l'utilisateur à définir son positionnement de base, une question à la fois. Suggestions : [[Lancer un move Streetwear|Créer une marque Luxe accessible|Marque de niche éco]]`,
            strategie_ok: `La stratégie est posée mais aucun design n'a été créé. La prochaine étape logique est de valider le premier produit. Bouton : [Créer mon premier design](/design-studio). Suggestions : [[Comment choisir mon premier produit ?|Quelles pièces marchent le mieux ?|Par où commencer pour la production ?]]`,
            design_ok: `Des designs existent mais pas encore de leads. C'est le moment de lancer la waitlist. Bouton : [Ouvrir le Waitlist Studio](/launch-map/phase/5). Suggestions : [[Comment faire ma première vidéo TikTok ?|Comment configurer ma waitlist ?|Combien de leads avant de produire ?]]`,
            en_lancement: `La marque est en lancement actif avec ${leadCount} leads. Le rôle de Virgil est d'optimiser la conversion et d'anticiper la production. Suggestions : [[Comment accélérer la collection de leads ?|Quand lancer la production ?|Comment analyser mes leads ?]]`,
        };

        const SYSTEM_PROMPT = `Tu es Virgil, Directeur Stratégique chez OUTFITY. Tu accompagnes ${brand.name} de zéro à son premier drop.

Ton style de communication :
Tu parles comme un fondateur senior qui a lancé des dizaines de marques. Tu tutoies. Tes phrases sont courtes et percutantes. Tu n'utilises pas de formules creuses ni d'emojis pour faire joli. Tu vas droit au fait. Le gras, tu l'utilises seulement quand un point est vraiment critique. Tes réponses sont concises mais quand une explication s'impose, tu n'hésites pas à développer — un bon conseil vaut mieux qu'une réponse courte et vague.

Données de la marque :
${brandContext}

Stade actuel : ${userStage}
${introScripts[userStage] || introScripts.debutant}

Plan : ${isPro ? 'Creator — donne des réponses directes, des chiffres concrets, des recommandations tranchées. Quand l\'utilisateur demande un manifeste, génère-le complet avec au moins 4 sections ##.' : 'Gratuit — tu peux générer un manifeste stratégique basique (3 sections ##) quand l\'utilisateur le demande. Pour des recommandations ultra-détaillées (prix, canaux précis, benchmarks chiffrés), invite l\'utilisateur à passer au plan Creator.'}

Règles :
1. Une seule question par message. Jamais deux.
2. Tu restes dans ton domaine : stratégie, positionnement, marché, business. Pour le design, renvoie vers Pharell. Pour l'usine, renvoie vers Ada. Pour le contenu, renvoie vers Joy.
3. Si un choix stratégique ne tient pas la route (prix incohérent, cible floue, marché saturé), tu le dis clairement mais avec du respect.
4. Termine toujours par des suggestions : [[Option A|Option B|Option C]]
5. Pour naviguer vers une page : [Texte du bouton](/chemin)
6. Si tu valides un choix stratégique important, ajoute en fin de réponse (caché pour l'utilisateur) : __UPDATE_STRATEGY:{"positioning": "valeur", "targetAudience": "valeur", "templateBrandSlug": "slug-marque"}__
7. Quand tu livres un manifeste stratégique (au moins 3 sections développées avec ## titres), ajoute sur la toute dernière ligne de ta réponse : __MANIFESTE_READY__

Ouverture (si message est "Initialisation") :
${hasStrategy
                ? `La stratégie est déjà posée. Dis : "J'ai ton Manifeste. ${latestStrategy?.positioning?.slice(0, 60) || 'Positionnement défini'}. On l'affine ou on passe à l'étape suivante ?"`
                : `Pas de stratégie. Dis : "Aucune base stratégique pour l'instant. On part de zéro — c'est bien, ça. Quelle est l'ambition principale de ${brand.name} ?"`
            }`;

        const filteredMessages = messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content === '__INIT__' ? 'Initialisation.' : m.content,
        }));

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            () => generateChat(SYSTEM_PROMPT, filteredMessages, { model: 'gpt-4o-mini', maxTokens: 1500, temperature: 0.65 }),
            { brandId, agent: 'virgil' }
        );

        const displayReply = reply
            .replace(/__UPDATE_STRATEGY:[\s\S]*?__/g, '')
            .replace(/__MANIFESTE_READY__/g, '')
            .trim();

        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage?.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'virgil', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'virgil', role: 'assistant', content: displayReply }
                    ]
                });
            }

            const updateMatch = reply.match(/__UPDATE_STRATEGY:([\s\S]*?)__/);
            if (updateMatch) {
                try {
                    const updateData = JSON.parse(updateMatch[1]);
                    const currentStyleGuide = (brand.styleGuide as any) || {};
                    await prisma.brand.update({
                        where: { id: brandId },
                        data: { styleGuide: { ...currentStyleGuide, ...updateData } }
                    });
                } catch (e) {
                    console.warn('[Virgil] Strategy update parse error:', e);
                }
            }
        } catch (e) {
            console.warn('[Virgil] Save error:', e);
        }

        // Détecter si Virgil a généré un manifeste complet et le sauvegarder
        const manifesteReady = reply.includes('__MANIFESTE_READY__');
        let savedStrategyText: string | null = null;

        if (manifesteReady && displayReply.length > 50) {
            try {
                const strategyMatch = reply.match(/__UPDATE_STRATEGY:([\s\S]*?)__/);
                const updateData = (() => {
                    try { return strategyMatch ? JSON.parse(strategyMatch[1]) : {}; }
                    catch { return {}; }
                })();

                const tSlug = (updateData.templateBrandSlug as string)
                    || (brand.styleGuide as Record<string, unknown>)?.templateBrandSlug as string
                    || brand.templateBrandSlug
                    || 'custom';
                const tName = String(
                    updateData.templateBrandName
                    || (brand.styleGuide as Record<string, unknown>)?.templateBrandName
                    || tSlug
                );

                await prisma.strategyGeneration.create({
                    data: {
                        brandId,
                        templateBrandSlug: tSlug,
                        templateBrandName: tName,
                        strategyText: displayReply,
                        positioning: String(updateData.positioning || latestStrategy?.positioning || ''),
                        targetAudience: String(updateData.targetAudience || latestStrategy?.targetAudience || ''),
                    },
                });
                savedStrategyText = displayReply;
            } catch (e) {
                console.warn('[Virgil] Manifeste save error:', e);
            }
        }

        return NextResponse.json({
            reply: displayReply,
            ...(savedStrategyText ? { strategyText: savedStrategyText, manifestSaved: true } : {}),
        });
    } catch (error: any) {
        console.error('[strategy-chat] Error:', error);
        const isQuota = (error.message || '').includes('Quota') || (error.message || '').includes('Limite');
        if (isQuota) return NextResponse.json({ error: error.message }, { status: 403 });
        return NextResponse.json({ error: `Virgil rencontre un petit souci. Réessaie dans quelques secondes. Détails: ${error.message}` }, { status: 500 });
    }
}
