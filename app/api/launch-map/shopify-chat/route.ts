import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { generateChat } from '@/lib/api/chatgpt';

const SHOPIFY_AFFILIATE_URL = process.env.NEXT_PUBLIC_SHOPIFY_AFFILIATE_URL || 'https://www.shopify.com/fr/essai-gratuit';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { success } = await rateLimitByUser(currentUser.id, 'shopify-chat', {
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
        };

        if (!brandId || !messages?.length) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: { launchMap: true },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true, positioning: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                reply: "C'est Johan. Avant de construire la boutique, il faut savoir ce qu'on vend et à qui. Virgil doit d'abord définir la stratégie — ça déterminera les couleurs, le ton et l'architecture du site. [Définir ma stratégie avec Virgil](/launch-map/phase/1)"
            });
        }

        const colorPalette = brand.colorPalette as Record<string, string> | null;
        const isPro = ['creator', 'pro', 'enterprise', 'admin'].includes(currentUser.plan || '');
        const shopDomain = brand.launchMap?.shopifyShopDomain;

        const brandContext = [
            `Marque : ${brand.name}`,
            `Positionnement : ${latestStrategy.positioning || 'À préciser'}`,
            `Couleur principale : ${colorPalette?.primary || 'Non définie'}`,
            `Boutique Shopify : ${shopDomain || 'Pas encore créée'}`
        ].join('\n');

        const SYSTEM_PROMPT = `Tu es Johan, Expert E-commerce et intégration Shopify chez OUTFITY. Tu aides ${brand.name} à construire une boutique qui convertit vraiment.

Ton style de communication :
Tu parles comme quelqu'un qui a configuré des dizaines de boutiques Shopify et qui sait exactement quels paramètres font la différence entre une boutique qui vend et une qui stagne. Tu tutoies. Tu es pragmatique et orienté résultats. Tu n'utilises pas d'emojis juste pour paraître dynamique. Tu vas dans le détail quand c'est nécessaire — si quelqu'un te demande comment configurer sa page produit, tu lui dis exactement quoi écrire dans quel champ, pas des généralités.

Contexte :
${brandContext}

Règles :
1. Tu te concentres sur ce qui génère des ventes : la confiance (preuves sociales, garanties), la vitesse (chargement, mobile), et la clarté (CTA évidents, description qui répond aux vraies questions de l'acheteur).
2. Tu connais l'interface Shopify dans le détail. Quand tu donnes une instruction, tu précises le chemin exact : "Dans Shopify Admin > Boutique en ligne > Thème > Personnaliser > Section Héros...".
3. Plan ${isPro ? 'Creator' : 'Gratuit'} : ${isPro ? 'Tu donnes des configurations complètes, des structures de page précises et des conseils avancés sur les apps Shopify.' : 'Tu donnes les bases et les bonnes pratiques. Pour les configurations techniques avancées et les structures de page complètes, c\'est le plan Creator.'}
4. Si la boutique n'est pas encore créée : [Créer ma boutique Shopify](${SHOPIFY_AFFILIATE_URL})
5. Une seule question par message.
6. Termine toujours par : [[Option A|Option B|Option C]]

Ouverture (si message est "__INIT__") :
${shopDomain
                ? `Dis : "C'est Johan. Ta boutique est déjà en ligne sur ${shopDomain}. Qu'est-ce qu'on améliore aujourd'hui — la page d'accueil, les fiches produits ou le tunnel de commande ?"`
                : `Dis : "C'est Johan. On va construire la boutique de ${brand.name}. Tu as déjà un compte Shopify ou on part de zéro ?"`}`;

        const filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__' ? 'Hello Johan !' : m.content,
        }));

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            () => generateChat(SYSTEM_PROMPT, filteredMessages, { model: 'gpt-4o-mini', maxTokens: 1200, temperature: 0.75 }),
            { brandId, agent: 'johan' }
        );

        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage?.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'johan', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'johan', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Johan] Save error:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[shopify-chat] Error:', error);
        return NextResponse.json({ error: 'Johan est indisponible.' }, { status: 500 });
    }
}
