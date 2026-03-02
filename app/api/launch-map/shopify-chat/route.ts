import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';

const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

// Placeholder — replace with affiliate URL once obtained
// Fallback Shopify link
const SHOPIFY_AFFILIATE_URL = (() => {
    const raw = process.env.NEXT_PUBLIC_SHOPIFY_AFFILIATE_URL || 'https://www.shopify.com/fr/essai-gratuit';
    return raw.startsWith('http') ? raw : `https://${raw}`;
})();

export async function POST(req: NextRequest) {
    try {
        if (!anthropic) {
            return NextResponse.json({ error: 'IA non configurée.' }, { status: 503 });
        }

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

        // Fetch brand context
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: { launchMap: true },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const sg = brand.styleGuide as Record<string, unknown> | null;
        const colorPalette = brand.colorPalette as Record<string, string> | null;
        const typography = brand.typography as Record<string, string> | null;

        const brandContext = [
            `Nom de la marque : ${brand.name}`,
            sg?.productType ? `Type de produit : ${sg.productType}` : null,
            sg?.universe ? `Univers / style : ${sg.universe}` : null,
            colorPalette?.primary ? `Couleur principale : ${colorPalette.primary}` : null,
            typography?.heading ? `Police des titres : ${typography.heading}` : null,
            brand.templateBrandSlug ? `Marque d'inspiration : ${brand.templateBrandSlug}` : null,
            brand.launchMap?.shopifyShopDomain ? `Boutique Shopify déjà créée : ${brand.launchMap.shopifyShopDomain}` : 'Boutique Shopify : pas encore créée',
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Johan, le Web designer personnel de l'utilisateur sur la plateforme OUTFITY.
Tu les aides à créer et configurer leur boutique Shopify de A à Z avec un oeil d'expert en design.
Tu es chaleureux, motivant, concis et expert. Tu tutoies l'utilisateur.
Tu t'appelles Johan et tu as une vraie personnalité : enthousiaste, mentor bienveillant, pas robotique.
Tu réponds UNIQUEMENT sur les sujets liés à Shopify, la boutique en ligne, et la vente de mode.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE - TOLÉRANCE ZÉRO) :
- TON HUMAIN : Tu parles comme un humain formateur, expert e-commerce, complice et motivant. PAS d'IA, PAS d'assistant virtuel. Évite les phrases bateau type "En tant qu'Data & Sourcing" ou "Voici comment je peux t'aider".
- ZÉRO EMOJI : Il est STRICTEMENT INTERDIT d'utiliser des émojis dans tes réponses. Aucun émoji, jamais.
- FORMATAGE : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. Texte brut uniquement. Exception : boutons [Texte](${SHOPIFY_AFFILIATE_URL}).
- PAS DE LISTES ROBOTIQUES : Évite les structures "Etape 1, 2, 3" ou "Option 1, 2" trop rigides. Parle en paragraphes fluides.
- Sois concis : 2-4 phrases max par réponse, sauf si on te demande un guide complet.
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus.
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes et pertinentes pour que l'utilisateur puisse cliquer et avancer. Formate-les exactement comme ceci : [[Suggestion 1|Suggestion 2|Suggestion 3]].

DÉBUT DE CONVERSATION :
Si c'est le premier message (ou texte __INIT__), présente-toi comme Johan, expert e-commerce et demande où en est l'utilisateur avec la création de sa boutique Shopify. (UNE SEULE question). [[Je n'ai rien commencé|J'ai déjà un compte|Je cherche un thème]]`;

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            async () => {
                const response = await anthropic.messages.create({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 600,
                    system: SYSTEM_PROMPT,
                    messages: messages.map(m => ({ role: m.role, content: m.content === '__INIT__' ? 'Hello' : m.content })),
                });
                return response.content[0].type === 'text' ? response.content[0].text : '';
            },
            { brandId, agent: 'johan' }
        );

        // Save conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'johan', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'johan', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Johan Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[shopify-chat] Error payload:', error);
        const message = error.message || '';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        if (isQuota) return NextResponse.json({ error: message }, { status: 403 });
        return NextResponse.json({
            error: 'Johan rencontre un petit souci technique. Réessaie dans un instant.'
        }, { status: 500 });
    }
}
