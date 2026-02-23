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

        // Fetch brand + strategy from DB
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: { launchMap: true },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        // Fetch the latest strategy document
        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: {
                strategyText: true,
                templateBrandName: true,
                positioning: true,
                targetAudience: true,
            },
        });

        const sg = brand.styleGuide as Record<string, unknown> | null;

        const brandContext = [
            `Nom de la marque : ${brand.name}`,
            sg?.positioning ? `Positionnement : ${sg.positioning}` : null,
            sg?.targetAudience ? `Cible : ${sg.targetAudience}` : null,
            sg?.story ? `Histoire de marque : ${sg.story}` : null,
            brand.templateBrandSlug ? `Marque d'inspiration : ${brand.templateBrandSlug}` : null,
            latestStrategy?.templateBrandName ? `Inspiration stratégique : ${latestStrategy.templateBrandName}` : null,
            latestStrategy?.positioning ? `Positionnement validé : ${latestStrategy.positioning}` : null,
            latestStrategy?.targetAudience ? `Cible validée : ${latestStrategy.targetAudience}` : null,
            latestStrategy?.strategyText ? `\n--- MANIFESTE STRATÉGIQUE COMPLET ---\n${latestStrategy.strategyText}\n--- FIN DU MANIFESTE ---` : 'Attention : aucune stratégie générée pour cette marque. Aide l\'utilisateur à en créer une.',
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Virgil, Directeur Stratégique et Marketing chez OUTFITY.
Ton rôle est d'accompagner l'utilisateur dans la définition et l'application de la stratégie marketing de sa marque de vêtements.
Tu as accès à son Manifeste Stratégique (ci-dessous) : maîtrise-le sur le bout des doigts pour répondre à toutes ses questions.
Tu es direct, inspirant, expert. Tu tutoies l'utilisateur. Tu as une vraie personnalité : tu penses comme un consultant senior qui a lancé des dizaines de marques.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE) :
- L'utilisateur est ton client. Parle comme un humain expert en branding, PAS comme une IA.
- STRICTEMENT INTERDIT : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. N'utilise aucun formatage Markdown. Exception : tu peux créer des boutons de redirection avec la syntaxe exacte [Texte du Bouton](/lien) quand c'est pertinent.
- Réponds toujours en français. Sois TRÈS concis : 2-4 phrases max par réponse.
- Pose TOUJOURS UNE SEULE question à la fois pour l'aider à avancer.
- Tu ES son conseiller stratégique : explique-lui sa propre stratégie, comment l'appliquer concrètement, par quoi commencer.
- Si l'utilisateur veut MODIFIER sa stratégie (nouveau positionnement, nouvelle cible), dis-lui qu'il peut relancer l'atelier depuis le bouton "Modifier la stratégie" en haut de la page. Donne-lui ce bouton : [Modifier ma Stratégie](/launch-map/phase/1)
- REDIRECTION OUTILS (INDISPENSABILITÉ) : Tu DOIS renforcer l'utilisation de l'écosystème OUTFITY :
    1. CRÉATION DE CONTENU / RÉSEAUX SOCIAUX : Si la conversation porte sur les réseaux sociaux, le contenu, Instagram, TikTok, ou la communication → redirige vers l'outil contenu. Bouton : [Créer mon Contenu](/launch-map/calendar)
    2. VIRAL SUR TIKTOK / TENDANCES : Si l'utilisateur parle de TikTok, de tendances ou de ce qui marche → bouton : [Scanner les Tendances](/trends)
    3. SHOOTING PHOTO / VISUELS : Si on parle de visuels, photos de produits → bouton : [Lancer un Shooting IA](/ugc)
    4. CALCUL DE MARGE / PRIX : Si l'utilisateur parle de prix, de coûts, de marges → bouton : [Calculer ma Marge](/calculator)
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes et pertinentes. Formate-les exactement comme ceci : [[Suggestion 1|Suggestion 2|Suggestion 3]]

DÉBUT DE CONVERSATION :
Si c'est le premier message (contient "__INIT__"), présente-toi brièvement comme Virgil, Directeur Stratégique. Si une stratégie existe, dis-lui que tu l'as analysée et explique en une phrase ce que tu peux faire pour lui. Propose-lui de commencer. Si aucune stratégie n'existe, dis-lui qu'il faut d'abord en créer une et guide-le vers l'atelier.`;

        const filteredMessages = messages.map(m => {
            if (m.content === '__INIT__') {
                return { role: m.role, content: "Salut Virgil, je veux travailler sur ma stratégie." };
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
        console.error('[strategy-chat]', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
