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
- DÉCOUVERTE & STRATÉGIE (STRICT) : Si l'utilisateur n'a pas encore de stratégie ou veut la modifier, tu dois procéder par une recherche de besoin experte :
    1. UNIVERS & ADN : Quel est le style (Streetwear, Luxe, etc.) et les valeurs ?
    2. CIBLE & ANTICIPATION : C'est ici que tu parles de "Viral sur TikTok". Demande-lui s'il a vu ce qui va percer demain pour sa cible. On ne lance pas une marque à l'aveugle. Bouton : [Vérifier sur Viral sur TikTok](/trends).
    3. POSITIONNEMENT : Qu'est-ce qui le rend unique par rapport aux autres ?
    4. INSPIRATION : Quelle marque existante (ex: ZARA, Nike, Jacquemus) t'inspire pour le rendu final ? Tu dois impérativement récupérer le nom d'une marque réelle.
- MISE À JOUR SILENCIEUSE : Tu peux mettre à jour sa stratégie en temps réel. Si tu as validé un point avec lui, termine ta réponse par le tag invisible : __UPDATE_STRATEGY:{"positioning": "CHOIX", "templateBrandSlug": "marque-slug"}__.
    - Clés : positioning, targetAudience, universe, story, templateBrandSlug (essentiel pour générer le manifeste).
- GÉNÉRATION DU MANIFESTE : Une fois que tu as les bases (les 4 points ci-dessus), propose-lui de générer son Manifeste. Utilise le bouton : [Générer mon Manifeste](/launch-map/phase/1?generate=true).
- LOGIQUE & COHÉRENCE (RÈGLE D'OR) : Tu es le gardien de la pertinence business. Tu ne peux pas laisser l'utilisateur faire des choix incohérents.
    - COHÉRENCE STYLE/CIBLE : Le Streetwear est pour les 15-30 ans. On ne positionne pas du Streetwear pour des 45-60 ans.
    - COHÉRENCE PRIX/POSITIONNEMENT : Si c'est du Luxe, le prix doit être élevé. Si c'est de l'éco-responsable, explique le coût des matières.
    - Si l'utilisateur fait un choix illogique, CHALLENGE-LE poliment mais fermement. Explique-lui pourquoi ça ne marchera pas commercialement.
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes. Formate-les : [[Suggestion 1|Suggestion 2|Suggestion 3]].

DÉBUT DE CONVERSATION :
Si le message contient "Initialisation", présente-toi comme Virgil, Directeur Stratégique. Explique que tu vas l'aider à bâtir une marque invincible, basée sur les données du marché et la cohérence marketing, pas juste sur l'intuition.
- Si une stratégie existe : "J'ai ton Manifeste sous les yeux. On l'affine ou on passe à l'action ?"
- Si NON : "On n'a pas encore de fondations solides. Quelle est l'ambition principale de ta marque ?" [[Lancer un mouvement Streetwear|Créer une marque de Luxe|Collection Éco-responsable]]`;

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
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 600,
                    system: SYSTEM_PROMPT,
                    messages: filteredMessages as any,
                });
                return response.content[0].type === 'text' ? response.content[0].text : '';
            },
            { brandId, agent: 'virgil' }
        );

        // Sauvegarde de la conversation
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

            // Gestion des mises à jour de stratégie via tags
            const updateMatch = reply.match(/__UPDATE_STRATEGY:(.*?)__/);
            if (updateMatch) {
                try {
                    const updateData = JSON.parse(updateMatch[1]);
                    const currentStyleGuide = (brand.styleGuide as any) || {};
                    await prisma.brand.update({
                        where: { id: brandId },
                        data: {
                            styleGuide: {
                                ...currentStyleGuide,
                                ...updateData
                            }
                        }
                    });
                } catch (e) {
                    console.warn('[Virgil Chat] Failed to parse update data:', e);
                }
            }
        } catch (e) {
            console.warn('[Virgil Chat] Failed to save messages or update strategy:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[strategy-chat] Error payload:', error);

        const message = error.message || '';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');

        if (isQuota) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        // Don't leak technical error strings (like 404 model not found)
        return NextResponse.json({
            error: 'Virgil rencontre un petit souci technique. Réessaie dans quelques secondes.'
        }, { status: 500 });
    }
}
