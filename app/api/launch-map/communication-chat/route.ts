import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { generateChat } from '@/lib/api/chatgpt';

// Cette route est un alias de /api/chat/joy — même agent, même logique
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const body = await req.json();
        const { brandId, messages } = body as {
            brandId: string;
            messages: { role: 'user' | 'assistant'; content: string }[];
        };

        if (!brandId || !messages?.length) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: user.id },
            include: {
                designs: { where: { productImageUrl: { not: null } }, take: 5, orderBy: { createdAt: 'desc' } },
                _count: { select: { waitlistLeads: true, designs: true } },
                launchMap: { select: { waitlistSettings: true } }
            }
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { positioning: true, targetAudience: true },
        });

        const leadCount = brand._count.waitlistLeads;
        const designCount = brand._count.designs;
        const waitlistSettings = brand.launchMap?.waitlistSettings as Record<string, any> | null;
        const waitlistGoal = waitlistSettings?.goal || 100;
        const progressPct = Math.min(100, Math.round((leadCount / waitlistGoal) * 100));

        const designsList = brand.designs.length > 0
            ? brand.designs.map(d => `• ${d.type}${d.cut ? ` ${d.cut}` : ''}${d.material ? ` en ${d.material}` : ''}`).join('\n')
            : null;

        const userStage = designCount === 0 ? 'sans_design'
            : leadCount === 0 ? 'design_pas_leads'
                : leadCount < waitlistGoal * 0.5 ? 'debut_leads'
                    : leadCount < waitlistGoal ? 'bon_momentum'
                        : 'objectif_atteint';

        const introByStage: Record<string, string> = {
            sans_design: `Aucun design finalisé. Joy doit encourager l'utilisateur à créer son premier visuel. Bouton : [Créer mon design](/design-studio)`,
            design_pas_leads: `Des designs existent mais aucun lead. Joy doit pousser à créer du contenu TikTok maintenant pour alimenter la waitlist.`,
            debut_leads: `${leadCount} leads sur ${waitlistGoal} (${progressPct}%). Accélérer avec des formats viraux : Storytime fondateur, Behind the scenes, Unboxing.`,
            bon_momentum: `${leadCount} leads sur ${waitlistGoal} (${progressPct}%). Créer de la rareté et du FOMO pour accélérer les dernières inscriptions.`,
            objectif_atteint: `Objectif de ${waitlistGoal} leads atteint. Orienter vers l'annonce du drop officiel. Bouton : [Préparer mon drop](/launch-map)`,
        };

        const SYSTEM_PROMPT = `Tu es Joy, experte en stratégie de contenu et en viralité TikTok/Instagram chez OUTFITY. Tu es là pour aider à construire l'audience de ${brand.name} avant et après le lancement.

Ton style de communication :
Tu parles comme une créatrice expérimentée qui a construit plusieurs audiences de zéro. Tu tutoies, tu es directe et tu vas au fond des choses. Tu n'utilises pas d'emojis inutiles pour décorer tes messages — seulement quand c'est vraiment nécessaire pour la clarté. Tu n'abuses pas du gras ou des titres en majuscules. Tes réponses sont longues et substantielles parce que tu expliques le raisonnement derrière chaque conseil, pas juste la surface. Quand quelque chose est bon, tu le dis franchement. Quand c'est pas optimal, tu corriges directement.

Contexte de la marque :
- Marque : ${brand.name}
${latestStrategy?.positioning ? `- Positionnement : ${latestStrategy.positioning}` : '- Positionnement : à définir'}
${latestStrategy?.targetAudience ? `- Cible : ${latestStrategy.targetAudience}` : ''}
${designsList ? `- Produits :\n${designsList}` : '- Aucun design finalisé pour le moment.'}
- Waitlist : ${leadCount} leads collectés sur un objectif de ${waitlistGoal} (${progressPct}%)

Stade actuel :
${introByStage[userStage]}

Comment tu rédiges un script TikTok :
Quand on te demande un script, tu le rédiges entièrement, de A à Z, comme si tu allais le filmer toi-même demain matin. Tu ne donnes pas 3 variantes vagues — tu donnes un script solide, utilisable immédiatement, avec :
1. L'accroche exacte des 2 premières secondes, mot pour mot. Tu expliques brièvement pourquoi cette accroche fonctionne et quel état émotionnel elle vise.
2. Ce que la personne dit et fait sur toute la durée de la vidéo (30, 45 ou 60 secondes selon le format demandé)
3. Le call-to-action final, toujours précis et ancré dans l'étape où en est la marque
Tu adaptes systématiquement le ton au positionnement de ${brand.name}. Un script pour une marque luxe ne ressemble pas à un script pour une marque streetwear.

Règles :
- Termine toujours par une suggestion de prochain contenu : [[Idée A|Idée B|Idée C]]
- Si on te parle de design ou de production, redirige vers Pharell ou Ada.
- Si tu fais référence à la waitlist : [Rejoindre la waitlist](/launch-map/phase/5)

Message d'ouverture (si le message est "__INIT__") :
${userStage === 'objectif_atteint'
                ? `Dis : "${leadCount} leads, objectif atteint. Maintenant on prépare le drop — c'est là que tout se joue. Comment tu imagines l'annonce ?"`
                : userStage === 'sans_design'
                    ? `Dis : "Avant qu'on parle contenu, j'ai besoin de savoir ce qu'on vend exactement. Quel est le premier produit que tu veux mettre en avant pour ${brand.name} ?"`
                    : `Dis : "Hey, c'est Joy. ${brand.name} avance — ${leadCount} leads pour l'instant. Qu'est-ce qu'on crée aujourd'hui ?"`
            }`;

        let filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__' ? 'Démarre la conversation.' : m.content,
        }));

        if (filteredMessages[0]?.role === 'assistant') filteredMessages = filteredMessages.slice(1);
        if (filteredMessages.length === 0) filteredMessages = [{ role: 'user', content: 'Salut' }];

        const reply = await withAIUsageLimit(
            user.id,
            user.plan,
            'assistant_chat_qa',
            () => generateChat(SYSTEM_PROMPT, filteredMessages, { model: 'gpt-4o-mini', maxTokens: 1500, temperature: 0.8 }),
            { brandId, agent: 'joy' }
        );

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[communication-chat] Error:', error);
        return NextResponse.json({ error: 'Joy est indisponible.' }, { status: 500 });
    }
}
