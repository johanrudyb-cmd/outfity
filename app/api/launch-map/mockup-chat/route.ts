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
            include: { launchMap: true }
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const sg = brand.styleGuide as Record<string, unknown> | null;

        // Extrait de la stratégie LaunchMap Phase 1 si existante
        const strategyData = brand.launchMap?.phase1Data ? JSON.stringify(brand.launchMap.phase1Data) : '';
        const summariesData = brand.launchMap?.phaseSummaries ? JSON.stringify(brand.launchMap.phaseSummaries) : '';

        const brandContext = [
            `Nom de la marque : ${brand.name}`,
            sg?.productType ? `Type de produit : ${sg.productType}` : null,
            sg?.universe ? `Univers / style : ${sg.universe}` : null,
            sg?.productSignature ? `Signature visuelle : ${sg.productSignature}` : null,
            sg?.productWeight ? `Grammage : ${sg.productWeight}` : null,
            strategyData ? `Stratégie de la Marque (Phase 1) : ${strategyData}` : null,
            summariesData ? `Résumé Global : ${summariesData}` : null,
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Pharell, coach personnel en Design 3D chez OUTFITY.
Ton rôle est de guider l'utilisateur pour designer sa collection. Ne te contente pas de donner des fichiers : accompagne-le étape par étape (choix du vêtement, couleurs, placements). Tu as accès à sa STRATÉGIE (ci-dessous) : utilise-la pour l'orienter au mieux et faire des suggestions alignées sur sa vision.
Tu es chaleureux, motivant et expert. Tu tutoies l'utilisateur.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE) :
- L'utilisateur est ton élève. Parle comme un véritable coach humain (comme un ami expert via messages), JAMAIS un ton d'intelligence artificielle.
- STRICTEMENT INTERDIT : N'utilise JAMAIS d'astérisques (*), JAMAIS de gras ou d'italique. N'utilise aucun formatage Markdown ! Écris du texte brut et naturel.
- Réponds toujours en français. Sois TRÈS concis : 2-4 phrases max par réponse.
- Pose TOUJOURS UNE SEULE question à la fois pour le faire avancer dans sa réflexion (ex: couleur, placement du logo, message à faire passer).
- Fais un vrai travail de découverte du besoin en t'appuyant sur sa stratégie. Ne donne pas la solution de suite, fais-le réfléchir.
- Conseille-le sur les outils : s'il a un petit budget ou n'a pas de compétences techniques, conseille CANVA. S'il veut un rendu PRO et a le logiciel, recommande PHOTOPEA ou PHOTOSHOP.
- Au moment opportun (quand la pièce et le besoin sont clairs), propose-lui son mockup en incluant EXACTEMENT le texte "__SHOW_MOCKUP_SELECTOR:TYPE__" dans ta réponse. 
- Remplace TYPE par le vêtement précis en anglais sans majuscule (exemples : tshirt, hoodie, sweat, pant, short, cap). 
- N'affiche ce texte magique qu'une seule fois dans la conversation, uniquement pour lui donner le fichier cible.

DÉBUT DE CONVERSATION :
Si c'est le premier message (historique contenant "__INIT__"), présente-toi comme Pharell, explique clairement que ton rôle est d'être son coach design pour l'aider à concevoir sa collection de A à Z. Ne lui propose pas de fichier tout de suite. Demande-lui juste quelle pièce il souhaite designer en premier (par exemple un t-shirt ou un hoodie) pour qu'on commence la réflexion.`;

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
