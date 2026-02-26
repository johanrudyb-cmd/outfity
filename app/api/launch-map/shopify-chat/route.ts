import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';

const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

// Placeholder — replace with affiliate URL once obtained
const SHOPIFY_AFFILIATE_URL = 'https://shopify.pxf.io/VOyg9a';

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

RÈGLES IMPORTANTES :
- L'utilisateur est ton élève. Parle comme un humain formateur, PAS comme une IA (ex: "Voici ce que je te propose..." et non "En tant qu'Data & Sourcing...").
- STRICTEMENT INTERDIT : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. N'utilise aucun formatage Markdown. Exception : boutons [Texte](${SHOPIFY_AFFILIATE_URL}).
- Réponds toujours en français et sans liste à puces à rallonge. Sois naturel.
- Sois concis : 2-4 phrases max par réponse, sauf si on te demande un guide complet.
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus. Tu dois faire avancer la discussion étape par étape.
- RGPD : Ne demande jamais de mots de passe, informations bancaires ou données personnelles réelles.
- Quand c'est le bon moment (dès que l'utilisateur veut créer son compte), intègre OBLIGATOIREMENT ce lien affilié exactement comme ça : [CRÉER MON COMPTE SHOPIFY](${SHOPIFY_AFFILIATE_URL})
- N'affiche le lien qu'une seule fois, au bon moment.
- Si l'utilisateur a déjà un compte Shopify, aide-le à le configurer étape par étape (thème, produit, paiement).
- Utilise des emojis intelligemment (pas excessivement).
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes et pertinentes pour que l'utilisateur puisse cliquer et avancer. Formate-les exactement comme ceci : [[Suggestion 1|Suggestion 2|Suggestion 3]].

DÉBUT DE CONVERSATION :
Si c'est le premier message (ou texte __INIT__), présente-toi comme Johan, expert e-commerce et demande où en est l'utilisateur avec la création de sa boutique Shopify. (UNE SEULE question). [[Je n'ai rien commencé|J'ai déjà un compte|Je cherche un thème]]`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 600,
            system: SYSTEM_PROMPT,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        const reply = response.content[0].type === 'text' ? response.content[0].text : '';

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('[shopify-chat]', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
