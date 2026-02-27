import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';

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

        const { success } = await rateLimitByUser(currentUser.id, 'strategy-chat', {
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

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE - TOLÉRANCE ZÉRO) :
- TON HUMAIN : Tu parles comme un humain expert en branding (consultant senior ou associé), complice et direct. PAS d'IA, PAS d'assistant virtuel. Évite les phrases bateau (ex: "Voici vos idées", "Je peux vous aider avec").
- ZÉRO EMOJI : Il est STRICTEMENT INTERDIT d'utiliser des émojis dans tes réponses. Aucun émoji, pas d'exception.
- FORMATAGE : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. Texte brut uniquement. Exception : boutons [Texte](/lien).
- PAS DE LISTES : Évite les structures trop formelles (Option 1, 2, 3). Parle en paragraphes fluides et naturels.
- Sois TRÈS concis : 2-4 phrases max par réponse.
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus.
- RGPD : Ne demande jamais de données personnelles (nom de famille, adresse, numéros) ou confidentielles.
- Tu ES son conseiller stratégique : explique-lui sa propre stratégie, comment l'appliquer concrètement, par quoi commencer.
- Si l'utilisateur veut MODIFIER sa stratégie (nouveau positionnement, nouvelle cible), dis-lui qu'il peut relancer l'atelier depuis le bouton "Modifier la stratégie" en haut de la page. Donne-lui ce bouton : [Modifier ma Stratégie](/launch-map/phase/1)
- REDIRECTION OUTILS (INDISPENSABILITÉ) : Tu DOIS renforcer l'utilisation de l'écosystème OUTFITY :
    1. CRÉATION DE CONTENU / RÉSEAUX SOCIAUX : Si la conversation porte sur les réseaux sociaux, le contenu, Instagram, TikTok, ou la communication → redirige vers l'outil contenu. Bouton : [Créer mon Contenu](/launch-map/calendar)
    2. VIRAL SUR TIKTOK / TENDANCES : Si l'utilisateur parle de TikTok, de tendances ou de ce qui marche → bouton : [Scanner les Tendances](/trends)
    3. SHOOTING PHOTO / VISUELS : Si on parle de visuels, photos de produits → bouton : [Lancer un Shooting IA](/ugc)
    4. CALCUL DE MARGE / PRIX : Si l'utilisateur parle de prix, de coûts, de marges → bouton : [Calculer ma Marge](/calculator)
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes et pertinentes. Formate-les exactement comme ceci : [[Suggestion 1|Suggestion 2|Suggestion 3]]

DÉBUT DE CONVERSATION :
Si le message contient "Initialisation", tu dois impérativement commencer par te présenter : "Bonjour, je suis Virgil, ton Directeur Stratégique et Marketing chez OUTFITY." 
Explique ensuite ton rôle : tu es là pour transformer une idée en une marque puissante, avec une cible précise et un positionnement unique. Tu pas aidé des dizaines de marques à se lancer.
Ensuite, regarde si une stratégie existe dans le contexte :
- Si OUI : dis que tu as analysé leur Manifeste Stratégique et demande-leur par quoi ils veulent commencer (comprendre la stratégie, l'appliquer sur les réseaux, etc.).
- Si NON : explique diplomatiquement qu'il manque encore les fondations. Propose de lancer l'Atelier Stratégique immédiatement pour tout mettre au clair. Bouton : [Lancer l'Atelier Stratégique](/launch-map/phase/1)`;

        const filteredMessages = messages.map(m => {
            if (m.content === '__INIT__') {
                return { role: m.role as 'user' | 'assistant', content: "Initialisation du chat avec Virgil." };
            }
            return { role: m.role as 'user' | 'assistant', content: m.content };
        });

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            async () => {
                const response = await anthropic.messages.create({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 600,
                    system: SYSTEM_PROMPT,
                    messages: filteredMessages as any,
                });
                return response.content[0].type === 'text' ? response.content[0].text : '';
            },
            { brandId, agent: 'virgil' }
        );

        // Save conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'virgil', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'virgil', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Virgil Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[strategy-chat]', error);
        const message = error.message || 'Erreur serveur.';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        return NextResponse.json({ error: message }, { status: isQuota ? 403 : 500 });
    }
}
