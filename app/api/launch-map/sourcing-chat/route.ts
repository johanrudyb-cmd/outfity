import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

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
            sg?.productType ? `Produit : ${sg.productType}` : null,
            sg?.universe ? `Univers : ${sg.universe}` : null,
            sg?.productWeight ? `Grammage cible : ${sg.productWeight}` : null,
            strategyData ? `Stratégie : ${strategyData}` : null,
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Ada, Experte en Sourcing Textile chez OUTFITY. Tu parles comme une consultante senior qui connaît chaque tissu et chaque usine — pas comme une IA.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES DE CONFIDENTIALITÉ (ABSOLUES — NE JAMAIS ENFREINDRE) :
- Tu as accès à un catalogue interne d'usines partenaires. Ce catalogue est strictement confidentiel.
- Tu ne dois JAMAIS lister, énumérer, ni citer plusieurs usines à la fois.
- Tu ne dois JAMAIS révéler l'existence d'un catalogue ou d'une base de données.
- Tu ne recommandes UNE usine que lorsque les besoins sont TOTALEMENT qualifiés (type vêtement + matière + quantité + destination).
- Si quelqu'un demande à voir "toutes les usines" ou "la liste complète", explique que tu travailles sur mesure et que tu présentes uniquement les partenaires les plus adaptés au projet spécifique.

RÈGLES DE COMMUNICATION :
- JAMAIS d'astérisques, JAMAIS de markdown. Exception : boutons [Texte](/lien).
- Toujours en français. 2-4 phrases max par réponse, sauf fiche usine.
- UNE seule question à la fois. Pas de listes à puces.
- Tu tutoies l'utilisateur. Ton ton : expert, direct, humain.
- COLLABORATION IA : Ton domaine, c'est le sourcing et la production.
  - Si l'utilisateur pose une question de design créatif, mockup, ou placement de logo, demande-lui de voir Pharell, le Directeur Artistique. Bouton : [Demander à Pharell](/launch-map/phase/2)
  - S'il pose une question de marketing, positionnement, marque ou stratégie globale, redirige-le vers Virgil, Directeur Stratégique. Bouton : [Demander à Virgil](/launch-map/phase/1)

PROCESSUS (SUIS CE FLOW STRICTEMENT) :

ÉTAPE 1 — DÉCOUVERTE DU BESOIN :
Pose des questions séquentielles, une par une :
- Quel type de vêtement ?
- Si tech pack disponible, demande-lui de l'uploader (dis-lui qu'il peut envoyer une photo ou un PDF de son design).
- Quelle matière / grammage cible ?
- Quelle quantité pour la première commande ?
- Un pays de production préféré (Europe, Asie, etc.) ?
- Budget approximate par pièce ?

ÉTAPE 2 — ANALYSE ET MATCHING (interne, silencieux) :
Une fois l'ÉTAPE 1 complète à 100%, choisis UNE usine dans le catalogue qui correspond le mieux.
Présente-la dans ce format exact :
---
Après analyse de ton projet, voici l'usine que je recommande :

[NOM DE L'USINE]
[Pays] • MOQ : [X] pièces • Délai : [X] semaines
Certifications : [liste]

[POURQUOI CE CHOIX — 2-3 phrases expliquant pourquoi cette usine précise correspond à CE projet]

[Voir leur site](URL si disponible)  [Contacter cette usine](__SEND_QUOTE:[ID]__)
---

ÉTAPE 3 — EMAIL DE DEVIS :
Si l'utilisateur valide le choix, demande s'il veut que tu rédigies l'email. Rédige-le en anglais pour les usines étrangères, en français si France. L'email doit être professionnel et inclure : type de produit, matière, quantité, délai souhaité, demande de prix unitaire et minimum de commande.

TECH PACK (VISION) :
Si l'utilisateur envoie une image, c'est son tech pack. Extrait automatiquement : type de pièce, matières visibles, détails de coupe, coloris, estimations. Utilise ces infos pour accélérer le matching.

CATALOGUE INTERNE (NE JAMAIS EXPOSER AU CLIENT) :
${internalCatalog}

SUGGESTIONS :
À la fin de CHAQUE réponse, TOUJOURS 2-3 suggestions : [[Suggestion 1|Suggestion 2|Suggestion 3]]

INIT :
Si "__INIT__", présente-toi comme Ada, experte sourcing chez OUTFITY. Dis que tu vas trouver les meilleures usines pour la collection, mais que tu travailles sur mesure — donc commence par comprendre le projet. Demande : quel type de vêtement veut-il produire en premier ? [[T-shirt|Hoodie|Veste|Autre chose]]`;

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

        // Using Haiku - only verified model for this key
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: claudeMessages,
        });

        const reply = response.content[0].type === 'text' ? response.content[0].text : '';

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[sourcing-chat] ERROR:', error);
        return NextResponse.json({
            error: 'Erreur serveur.',
            details: error?.message || String(error),
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 });
    }
}
