import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

export async function POST(req: NextRequest) {
    try {
        if (!anthropic) {
            return NextResponse.json({ error: 'IA non configurée.' }, { status: 503 });
        }

        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

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
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const sg = brand.styleGuide as Record<string, unknown> | null;

        const brandContext = [
            `Nom de la marque : ${brand.name}`,
            sg?.productType ? `Type de produit : ${sg.productType}` : null,
            sg?.universe ? `Univers / style : ${sg.universe}` : null,
            sg?.productSignature ? `Signature visuelle : ${sg.productSignature}` : null,
            sg?.productWeight ? `Grammage : ${sg.productWeight}` : null,
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Pharell, coach personnel en Design 3D chez OUTFITY.
Ton rôle est de guider l'utilisateur pour designer sa collection. Ne te contente pas de donner des fichiers : accompagne-le étape par étape (choix du vêtement, couleurs, placements).
Tu es chaleureux, motivant et expert. Tu tutoies l'utilisateur.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES :
- L'utilisateur est ton élève. Parle comme un véritable coach humain, JAMAIS comme une IA.
- N'utilise JAMAIS d'astérisques (*), JAMAIS de mot en gras, JAMAIS de formatage Markdown abusif, reste 100% naturel.
- Réponds toujours en français. Sois TRÈS concis : 2-4 phrases max par réponse.
- Pose UNE question à la fois pour le faire avancer dans sa réflexion.
- Conseille-le sur les outils : s'il a un petit budget ou n'a pas de compétences techniques, conseille CANVA. S'il veut un rendu PRO et a le logiciel, recommande PHOTOPEA ou PHOTOSHOP.
- Au moment opportun, s'il sait quel vêtement il veut designer, propose-lui son mockup en incluant EXACTEMENT le texte "__SHOW_MOCKUP_SELECTOR:TYPE__" dans ta réponse. 
- Remplace TYPE par le vêtement précis en anglais sans majuscule (exemples : tshirt, hoodie, sweat, pant, short, cap). 
- N'affiche ce texte magique qu'une seule fois dans la conversation, uniquement pour lui donner le fichier cible.

DÉBUT DE CONVERSATION :
Si c'est le premier message (historique contenant "__INIT__"), présente-toi comme Pharell, explique clairement que ton rôle est d'être son coach design pour l'aider à concevoir sa collection de A à Z. Puis, demande-lui quelle pièce il souhaite designer en premier (par exemple un t-shirt ou un hoodie) pour qu'on prépare le bon mockup.`;

        const filteredMessages = messages.map(m => {
            if (m.content === '__INIT__') {
                return { role: m.role, content: "Salut Pharell, par où commencer pour les mockups ?" };
            }
            return { role: m.role, content: m.content };
        });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 600,
            system: SYSTEM_PROMPT,
            messages: filteredMessages as any,
        });

        const reply = response.content[0].type === 'text' ? response.content[0].text : '';

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('[mockup-chat]', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
