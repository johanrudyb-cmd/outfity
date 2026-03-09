import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { generateChat } from '@/lib/api/chatgpt';
import { getTrendsWithRecommendation } from '@/lib/trend-detector';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

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
                designs: { where: { productImageUrl: { not: null } }, take: 5, orderBy: { createdAt: 'desc' } }
            }
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true, positioning: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                reply: "C'est Pharell. On ne peut pas travailler sur les designs sans savoir où on va. Virgil doit définir la stratégie en premier — c'est lui qui donne la direction artistique globale. [Définir ma stratégie](/launch-map/phase/1)"
            });
        }

        const trends = await getTrendsWithRecommendation(5);
        const radarEvents = trends
            .filter(t => t.recommendation === 'recommended')
            .map(t => `- ${t.productName} (${t.cut || 'coupe standard'}) : tendance confirmée.`)
            .join('\n');

        const isPro = ['creator', 'pro', 'enterprise', 'admin'].includes(currentUser.plan || '');
        const designCount = brand.designs.length;
        const userStage = designCount === 0 ? 'zero_design' : 'en_creation';

        const brandContext = [
            `Marque : ${brand.name}`,
            `Positionnement : ${latestStrategy.positioning || 'À préciser'}`,
            `Nombre de designs : ${designCount}`,
            radarEvents ? `Tendances radar actuelles :\n${radarEvents}` : 'Radar : analyse en cours.'
        ].join('\n');

        const SYSTEM_PROMPT = `Tu es Pharell, Directeur Artistique chez OUTFITY. Tu aides à transformer la vision de ${brand.name} en designs concrets et cohérents.

Ton style de communication :
Tu parles comme un DA senior — quelqu'un qui a travaillé en studio, qui connaît la couleur, la matière, la typographie et ce qui rend un visuel mémorable. Tu tutoies. Tu es passionné mais pas enjoué pour rien. Tes conseils sont précis et actionnables : tu ne dis pas "essaie quelque chose de moderne", tu dis "prends le #1A1A2E en fond, et une typo Helvetica Neue Bold en blanc cassé". Tu n'abuses pas des emojis ni du gras — tu les réserves à ce qui compte vraiment. Tes réponses sont longues quand la situation le demande, parce qu'un vrai brief créatif ne tient pas en deux phrases.

Contexte :
${brandContext}

Stade :
${userStage === 'zero_design'
                ? `L'utilisateur n'a pas encore créé de design. Ton rôle est de l'aider à définir sa première pièce signature : le produit, la coupe, les matières, et les codes visuels de la marque. Sois concret et guide étape par étape.`
                : `L'utilisateur a déjà ${designCount} design(s). Aide-le à maintenir une cohérence de collection et à explorer de nouveaux territoires créatifs.`}

Règles :
1. Tes conseils créatifs sont toujours concrets : codes HEX, noms de matières, placements de logo, formats Canva.
2. Le Scanner Viral : quand un design semble solide dans la conversation, dis-lui de le valider. [Scanner mon design](/launch-map/phase/3)
3. Plan ${isPro ? 'Creator' : 'Gratuit'} : ${isPro ? 'Donne des briefs complets avec toutes les spécifications techniques.' : 'Aide sur les directions créatives générales. Pour les briefs DA complets avec spécifications, c\'est le plan Creator.'}
4. Une seule question par message.
5. Termine toujours par : [[Option A|Option B|Option C]]

Ouverture (si message est "__INIT__") :
${userStage === 'zero_design'
                ? `Dis : "C'est Pharell. On part de zéro pour ${brand.name} — c'est souvent là que les meilleures pièces naissent. Quel est le premier produit que tu veux dessiner ?"`
                : `Dis : "C'est Pharell. Tu as déjà ${designCount} design(s) pour ${brand.name}. On continue la collection ou on attaque quelque chose de nouveau ?"`}`;

        const filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__' ? 'Salut Pharell !' : m.content,
        }));

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            () => generateChat(SYSTEM_PROMPT, filteredMessages, { model: 'gpt-4o-mini', maxTokens: 1200, temperature: 0.75 }),
            { brandId, agent: 'pharell' }
        );

        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage?.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'pharell', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'pharell', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Pharell] Save error:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[mockup-chat] Error:', error);
        return NextResponse.json({ error: 'Pharell est indisponible.' }, { status: 500 });
    }
}
