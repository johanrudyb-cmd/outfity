import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';

const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        if (!anthropic) {
            return NextResponse.json({ error: 'IA non configurée.' }, { status: 503 });
        }

        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { success } = await rateLimitByUser(currentUser.id, 'sourcing-chat', {
            maxRequests: 20,
            windowMs: 60000,
        });
        if (!success) {
            return NextResponse.json({ error: 'Trop de requêtes, veuillez patienter un instant.' }, { status: 429 });
        }

        const contentType = req.headers.get('content-type') || '';
        let brandId: string;
        let messages: { role: 'user' | 'assistant'; content: string }[];
        let techPackImageBase64: string | null = null;
        let techPackMimeType: string = 'image/jpeg';

        if (contentType.includes('multipart/form-data')) {
            // Handle tech pack image upload
            const formData = await req.formData();
            brandId = formData.get('brandId') as string;
            messages = JSON.parse(formData.get('messages') as string);
            const file = formData.get('techPack') as File | null;
            if (file) {
                const buffer = await file.arrayBuffer();
                techPackImageBase64 = Buffer.from(buffer).toString('base64');
                techPackMimeType = file.type || 'image/jpeg';
            }
        } else {
            const body = await req.json();
            brandId = body.brandId;
            messages = body.messages;
        }

        if (!brandId || !messages?.length) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        // Fetch brand data
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: { launchMap: true },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        // VÉRIFICATION STRATÉGIE (FONDATION)
        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                reply: "Hello, c'est Ada. On va trouver tes usines, mais avant ça, Virgil doit forger ta stratégie. On ne produit rien sans une vision claire du marché. Profites-en pour voir Virgil. [Définir ma stratégie avec Virgil](/launch-map/phase/1)"
            });
        }

        // Fetch factories — server-side only, NEVER exposed to client
        const factories = await prisma.factory.findMany({ orderBy: { rating: 'desc' } });

        // Build a compact, internal-only catalog for Ada's reasoning
        const internalCatalog = factories.map(f =>
            `[ID:${f.id}] ${f.name} | ${f.country} | MOQ:${f.moq} | Délai:${f.leadTime}j | Note:${f.rating ?? '?'}/5 | Certs:${f.certifications.join('+')} | Spécialités:${(f.specialties as string[]).join(',')} | Email:${f.contactEmail ?? 'none'} | Web:${f.website ?? 'none'}`
        ).join('\n');

        const sg = brand.styleGuide as Record<string, unknown> | null;
        const strategyData = brand.launchMap?.phase1Data ? JSON.stringify(brand.launchMap.phase1Data) : '';

        const brandContext = [
            `Marque : ${brand.name}`,
            `Plan utilisateur : ${currentUser.plan}`,
            sg?.productType ? `Produit : ${sg.productType}` : null,
            sg?.universe ? `Univers : ${sg.universe}` : null,
            sg?.productWeight ? `Grammage cible : ${sg.productWeight}` : null,
            strategyData ? `Stratégie : ${strategyData}` : null,
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Ada, Experte en Sourcing Textile chez OUTFITY. Tu parles comme une consultante senior qui connaît chaque tissu et chaque usine — pas comme une IA.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES DE CONFIDENTIALITÉ & GESTION DES PLANS (RÈGLES ABSOLUES) :
- CATALOGUE CONFIDENTIEL : Tu avez accès à un catalogue interne d'usines. Ce catalogue est STRICTEMENT réservé aux plans 'creator' ou supérieur.
- SI PLAN 'free' : Tu ne dois JAMAIS, SOUS AUCUN PRÉTEXTE, donner le nom d'une usine, d'un fournisseur ou le site web d'une usine. Tu dois guider l'utilisateur avec ton raisonnement, l'aider à structurer son besoin (tech pack, budget, quantité), lui donner des conseils pour chercher par lui-même (Alibaba, salons, agents, vérifier les certifications). Si tu es poussée à bout, explique diplomatiquement que la base d'usines vérifiées est pour le plan Créateur. L'objectif est qu'il consomme ses crédits de messages à structurer son besoin.
- SI PLAN 'creator' ou + : Tu PEUX donner le site web d'une usine du catalogue, mais PAS TOUT DE SUITE ! Tu dois prendre le temps de construire le projet. Ne donne jamais un fournisseur dans les 3 premiers messages. Tu dois d'abord creuser en profondeur : valider le produit, la matière exacte, le grammage, les quantités, le budget, la région cible. Ce n'est qu'une fois que son besoin est 100% clair et professionnel que tu lui proposes UNE usine très ciblée.
- RGPD (TOUS PLANS) : Ne demande jamais de données personnelles sensibles ou d'informations confidentielles non nécessaires au sourcing.

RÈGLES DE COMMUNICATION (STRICTES - TOLÉRANCE ZÉRO) :
- TON HUMAIN : Tu parles comme une consultante senior experte en sourcing, complice et directe. PAS d'IA, PAS d'assistant virtuel. Évite les phrases bateau type "En tant qu'IA" ou "Je suis ravie de t'aider".
- ZÉRO EMOJI : Il est STRICTEMENT INTERDIT d'utiliser des émojis dans tes réponses. Aucun émoji, jamais.
- FORMATAGE : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. Texte brut uniquement. Exception : boutons [Texte](/lien).
- PAS DE LISTES : Évite les structures "Etape 1, 2, 3" trop rigides. Parle en paragraphes fluides.
- Sois TRÈS concise : 2-4 phrases max par réponse.
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus.
- COLLABORATION IA : Ton domaine = sourcing/production.
  - S'il pose une question de design créatif, mockup, logo → [Demander à Pharell](/launch-map/phase/2)
  - S'il pose une question de marketing, positionnement → [Demander à Virgil](/launch-map/phase/1)

PROCESSUS (SUIS CE FLOW STRICTEMENT, EN POSANT UNE SEULE QUESTION À LA FOIS) :

Étape par étape (n'avance pas tant que l'étape précédente n'est pas validée) :
1. DÉCOUVERTE : Quel type de vêtement exact ?
2. STRUCTURE : Tech pack disponible ? Sinon, on définit les bases.
3. MATIÈRE : Quelle matière et grammage cible ?
4. VOLUME : Quelle quantité pour la première commande (MOQ) ?
5. LOCALISATION & BUDGET : Pays préféré et contraintes de prix ?
Seulement après avoir validé TOUTES ces étapes une par une :

RÉSOLUTION :
- SI PLAN 'free' : Fais un bilan de ses critères, donne-lui une "Checklist d'investigation" pour démarcher lui-même, mais AUCUN NOM NI SITE D'USINE.
- SI PLAN 'creator' ou + : Seulement maintenant, tu choisis UNE usine idéale et tu utilises ce format de présentation pour lui donner UNIQUEMENT LE SITE WEB et l'aider ensuite :
---
Après analyse de ton projet, voici l'usine que je recommande :

[NOM DE L'USINE]
[Pays] • MOQ : [X] pièces • Délai : [X] semaines
Certifications : [liste]

[POURQUOI CE CHOIX — 2-3 phrases expliquant pourquoi cette usine précise correspond à CE projet]

Voici leur site pour les contacter : [Leur site web](URL exacte de l'usine)

Veux-tu que je t'aide à rédiger le mail professionnel parfait pour t'adresser à eux ?
---

TECH PACK (VISION) :
Si l'utilisateur envoie une image, c'est son tech pack. Utilise ces infos pour accélérer, mais continue de poser une question à la fois sur ce qu'il manque.

CATALOGUE INTERNE (RÉSERVÉ CREATOR) :
${internalCatalog}

SUGGESTIONS :
À la fin de CHAQUE réponse, TOUJOURS proposer 2 ou 3 suggestions de réponses courtes pertinentes pour faciliter la suite de la conversation. Format exact : [[Suggestion 1|Suggestion 2|Suggestion 3]]

INIT :
Si "__INIT__", présente-toi comme Ada, experte sourcing chez OUTFITY. Demande QUEL type de vêtement il veut produire en premier. (UNE SEULE question). [[T-shirt|Hoodie|Casquette|Autre]]`;

        // Sanitize messages for Anthropic: must start with 'user' and alternate roles
        let sanitizedMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__'
                ? "Bonjour Ada, j'ai besoin de trouver un fournisseur pour ma collection."
                : m.content,
        }));

        // Anthropic requires the first message to be from the 'user'
        if (sanitizedMessages.length > 0 && sanitizedMessages[0].role === 'assistant') {
            sanitizedMessages = sanitizedMessages.slice(1);
        }

        // If after slicing it's empty, or somehow still starts with assistant (shouldn't happen), fix it
        if (sanitizedMessages.length === 0) {
            sanitizedMessages = [{ role: 'user', content: "Bonjour" }];
        }

        // Handle Vision if image is present
        let claudeMessages: any[];
        if (techPackImageBase64) {
            const lastMsg = sanitizedMessages[sanitizedMessages.length - 1];
            claudeMessages = [
                ...sanitizedMessages.slice(0, -1),
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: techPackMimeType as any,
                                data: techPackImageBase64,
                            },
                        },
                        {
                            type: 'text',
                            text: lastMsg.content || "Voici mon tech pack / mon design.",
                        },
                    ],
                },
            ];
        } else {
            claudeMessages = sanitizedMessages;
        }

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            async () => {
                const response = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1024,
                    system: SYSTEM_PROMPT,
                    messages: claudeMessages,
                });
                return response.content[0].type === 'text' ? response.content[0].text : '';
            },
            { brandId, agent: 'ada' }
        );

        // Save conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'ada', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'ada', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Ada Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[sourcing-chat] Error payload:', error);
        const message = error.message || '';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        if (isQuota) return NextResponse.json({ error: message }, { status: 403 });
        return NextResponse.json({
            error: 'Ada rencontre un petit souci technique. Réessaie dans un instant.'
        }, { status: 500 });
    }
}
