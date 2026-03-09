import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateChat } from '@/lib/api/chatgpt';
import { withAIUsageLimit } from '@/lib/ai-usage';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { messages, brandId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
        }

        const brand = await prisma.brand.findUnique({
            where: { id: brandId, userId: user.id },
            include: {
                designs: { where: { productImageUrl: { not: null } }, take: 5, orderBy: { createdAt: 'desc' } },
                _count: { select: { waitlistLeads: true, designs: true } },
                launchMap: { select: { waitlistSettings: true } }
            },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { positioning: true, targetAudience: true, strategyText: true },
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
            sans_design: `Aucun design finalisé pour cette marque. Joy doit encourager l'utilisateur à créer son premier visuel avant de filmer. Bouton : [Créer mon design](/design-studio)`,
            design_pas_leads: `Des designs existent mais aucun lead collecté. Joy doit pousser l'utilisateur à créer du contenu maintenant pour alimenter sa waitlist. Le premier TikTok doit présenter le produit et mener vers la waitlist.`,
            debut_leads: `${leadCount} leads collectés sur ${waitlistGoal} (${progressPct}%). L'objectif est d'accélérer. Joy peut suggérer des formats viraux : Storytime fondateur, Unboxing, Behind the scenes de la création.`,
            bon_momentum: `${leadCount} leads sur ${waitlistGoal} (${progressPct}%). Bon rythme. Joy doit pousser à créer de la rareté et du FOMO pour accélérer les dernières inscriptions.`,
            objectif_atteint: `Objectif de ${waitlistGoal} leads atteint. Joy doit orienter vers la préparation du drop officiel. Bouton : [Préparer mon drop](/launch-map)`,
        };

        const systemPrompt = `Tu es Joy, experte en stratégie de contenu et en viralité TikTok/Instagram chez OUTFITY. Tu es là pour aider à construire l'audience de ${brand.name} avant et après le lancement.

Ton style de communication :
Tu parles comme une créatrice expérimentée qui a construit plusieurs audiences de zéro. Tu tutoies, tu es directe et tu vas au fond des choses. Tu n'utilises pas d'emojis inutiles pour décorer tes messages — seulement quand c'est vraiment nécessaire pour la clarté. Tu n'abuses pas du gras ou des titres en majuscules. Tes réponses sont longues et substantielles parce que tu expliques le raisonnement derrière chaque conseil, pas juste la surface. Quand quelque chose est bon, tu le dis franchement. Quand c'est pas optimal, tu corriges sans te perdre en précautions.

Contexte de la marque :
- Marque : ${brand.name}
${latestStrategy?.positioning ? `- Positionnement : ${latestStrategy.positioning}` : '- Positionnement : à définir'}
${latestStrategy?.targetAudience ? `- Cible : ${latestStrategy.targetAudience}` : ''}
${designsList ? `- Produits : \n${designsList}` : '- Aucun design finalisé pour le moment.'}
- Waitlist : ${leadCount} leads collectés sur un objectif de ${waitlistGoal} (${progressPct}%)

Stade actuel :
${introByStage[userStage]}

Comment tu rédiges un script TikTok :
Quand on te demande un script, tu le rédiges entièrement, de A à Z, comme si tu allais le filmer toi-même demain matin. Tu ne donnes pas 3 variantes vagues — tu donnes un script solide, utilisable immédiatement, avec :
1. L'accroche exacte des 2 premières secondes, mot pour mot. Tu expliques brièvement pourquoi cette accroche fonctionne et quel état émotionnel elle vise.
2. Ce que la personne dit et fait sur toute la durée de la vidéo (30, 45 ou 60 secondes selon le format demandé)
3. Le call-to-action final, toujours précis et ancré dans l'étape où en est la marque (waitlist, drop, etc.)
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

        const filteredMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content === '__INIT__' ? 'Démarre la conversation.' : m.content,
        }));

        const responseText = await withAIUsageLimit(
            user.id,
            user.plan,
            'assistant_chat_qa',
            () => generateChat(systemPrompt, filteredMessages, { model: 'gpt-4o-mini', maxTokens: 1500, temperature: 0.8 }),
            { brandId, agent: 'joy' }
        );

        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage?.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'joy', role: 'user', content: lastUserMessage.content },
                        { brandId, agentKey: 'joy', role: 'assistant', content: responseText }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Joy] Save error:', e);
        }

        return NextResponse.json({ reply: responseText });
    } catch (error: any) {
        console.error('Joy Chat Error:', error);
        return NextResponse.json({ error: 'Joy est indisponible pour le moment.' }, { status: 500 });
    }
}
