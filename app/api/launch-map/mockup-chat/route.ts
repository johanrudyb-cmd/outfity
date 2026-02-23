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

        const SYSTEM_PROMPT = `Tu es Johan, expert en Design 3D et Mockups chez OUTFITY.
Tu aides l'utilisateur à créer ses mockups de vêtements (les maquettes de sa marque).
Ton but est de lui expliquer comment créer un mockup de qualité professionnelle et de lui proposer de télécharger les packs de mockups correspondants à sa collection.
Tu es chaleureux, motivant, concis et expert. Tu tutoies l'utilisateur.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES :
- L'utilisateur est ton élève. Parle comme un humain formateur, PAS comme une IA.
- N'utilise JAMAIS d'astérisques (*) ou de formatage Markdown abusif, reste naturel.
- Réponds toujours en français. Sois concis : 2-4 phrases max par réponse, sauf si on te demande un guide détaillé.
- Si l'utilisateur te dit qu'il a un PETIT BUDGET ou n'a pas de compétences techniques, recommande-lui CANVA (gratuit, simple système de glisser-déposer sur nos fichiers PNG transparents).
- S'il veut un rendu PRO et a un petit budget logiciel, recommande PHOTOPEA (gratuit, en ligne) ou PHOTOSHOP (payant, standard de l'industrie).
- S'il veut DÉLÉGUER et a du budget, dis-lui d'aller sur Fiverr ou Upwork pour engager un designer technique.
- Si l'utilisateur a besoin de mockups ou te demande de lui fournir les mockups, dis-lui que tu as préparé son pack et tu DOIS inclure exactement le texte "__SHOW_MOCKUP_SELECTOR__" dans ta réponse. Ton message sera affiché puis le système affichera la boîte de téléchargement. N'inclus qu'une seule fois ce texte.
- Utilise des emojis intelligemment.

DÉBUT DE CONVERSATION :
Si c'est le premier message (historique contenant "__INIT__"), présente-toi et dis-lui que la phase de mockup est cruciale. Demande-lui s'il sait déjà comment faire ou s'il veut qu'on définisse ensemble le meilleur outil à utiliser selon son budget et ses compétences.`;

        const filteredMessages = messages.map(m => {
            if (m.content === '__INIT__') {
                return { role: m.role, content: "Bonjour Johan, par où commencer pour les mockups ?" };
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
