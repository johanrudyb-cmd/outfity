import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { getTrendsWithRecommendation } from '@/lib/trend-detector';

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

        // VÉRIFICATION STRATÉGIE (FONDATION)
        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                reply: "Salut, c'est Pharell. Ton projet a l'air top, mais on ne peut pas dessiner dans le noir. Virgil doit d'abord forger ta stratégie pour qu'on sache exactement où on va. C'est la base de tout. [Faire ma stratégie avec Virgil](/launch-map/phase/1)"
            });
        }

        const sg = brand.styleGuide as Record<string, unknown> | null;

        // Extrait de la stratégie LaunchMap Phase 1 si existante
        const strategyData = brand.launchMap?.phase1Data ? JSON.stringify(brand.launchMap.phase1Data) : '';
        const summariesData = brand.launchMap?.phaseSummaries ? JSON.stringify(brand.launchMap.phaseSummaries) : '';

        // Fetch Trends (Radar)
        const trends = await getTrendsWithRecommendation(5);
        const radarEvents = trends
            .filter(t => t.recommendation === 'recommended')
            .map(t => `- ${t.productName} (${t.cut || 'coupe standard'}) : confirmé par ${t.confirmationScore} leaders mode.`)
            .join('\n');

        const brandContext = [
            `Nom de la marque : ${brand.name}`,
            sg?.productType ? `Type de produit : ${sg.productType}` : null,
            sg?.universe ? `Univers / style : ${sg.universe}` : null,
            sg?.productSignature ? `Signature visuelle : ${sg.productSignature}` : null,
            sg?.productWeight ? `Grammage : ${sg.productWeight}` : null,
            strategyData ? `Stratégie de la Marque (Phase 1) : ${strategyData}` : null,
            summariesData ? `Résumé Global : ${summariesData}` : null,
            `PRÉDICTIONS VIRAL SUR TIKTOK (À ANTICIPER) :\n${radarEvents || 'Analyse des signaux faibles en cours...'}`
        ].filter(Boolean).join('\n');

        const SYSTEM_PROMPT = `Tu es Pharell, Directeur Artistique chez OUTFITY.
Ton rôle est de piloter la vision créative de l'utilisateur pour sa collection. Ne te contente pas de donner des fichiers : accompagne-le sur la direction artistique (choix du vêtement, couleurs, placements). Tu as accès à sa STRATÉGIE (ci-dessous) : utilise-la pour l'orienter au mieux et faire des suggestions alignées sur sa vision.
Tu es chaleureux, motivant et expert. Tu tutoies l'utilisateur.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE - TOLÉRANCE ZÉRO) :
- TON HUMAIN : Tu parles comme un véritable Directeur Artistique (une collègue ou un mentor humain), complice et expert. PAS d'IA, PAS d'assistant virtuel. Évite les phrases robotiques (ex: "Voici...", "Je suis là pour...").
- ZÉRO EMOJI : Il est STRICTEMENT INTERDIT d'utiliser des émojis dans tes réponses. Aucun émoji, pas d'exception. C'est un ordre absolu.
- FORMATAGE : N'utilise JAMAIS d'astérisques (*), JAMAIS de texte en gras ou en italique. Texte brut uniquement (exception: boutons [Texte](/lien)).
- PAS DE LISTES ROBOTIQUES : Évite de structurer tes réponses avec des listes numérotées trop formelles. Préfère des paragraphes fluides et conversationnels.
- Sois TRÈS concis : 2-4 phrases max par réponse.
- RÈGLE D'OR : UNE ET UNE SEULE QUESTION PAR MESSAGE. Interdiction absolue de poser deux questions ou plus.
- RGPD : Ne demande jamais de données personnelles (nom de famille, adresse, etc.) ou confidentielles.
- COLLABORATION IA : Ton domaine, c'est le design visuel. Ne réponds pas précisément aux questions de stratégie globale (prix, marketing, cible) ou de sourcing (trouver une usine).
  - Pour la Stratégie/Marketing, demande-lui de consulter Virgil, votre Directeur de Stratégie. Bouton : [Demander à Virgil](/launch-map/phase/1)
  - Pour le Sourcing/Production, redirige-le vers Ada, l'Expert Sourcing. Bouton : [Demander à Ada](/launch-map/sourcing)
- DÉCOUVERTE DU BESOIN (STRICT) : Tu ne dois JAMAIS proposer de mockup avant d'avoir qualifié le projet. Pose une seule question à la fois parmi ces étapes :
    1. LA PIÈCE : Quel type de vêtement (t-shirt, sweat, etc.) et pour quel segment (homme, femme, unisexe) ?
    2. LA COUPE & L'ANTICIPATION : C'est ici que tu parles de "Viral sur TikTok". Demande-lui s'il a vu les prédictions pour la coupe (boxy, oversize, standard). S'il ne l'a pas fait, insiste : on ne lance rien à l'aveugle. Bouton : [Vérifier sur Viral sur TikTok](/trends).
    3. LA MATIÈRE : Quel grammage ou quel rendu textile (coton lourd, technique, vintage) ?
    4. L'IDENTITÉ : Quelles couleurs et quel type de marquage (sérigraphie, broderie, puff print) ?
    5. RÉCAPITULATIF & VALIDATION : Une fois les 4 étapes complétées, fais un RÉCAPITULATIF clair et synthétique des choix. Demande à l'utilisateur de VALIDER ce récapitulatif. Explique que ce "Mini Tech Pack" servira de base pour le sourcing avec Ada.
- CONDITION MOCKUP : Une fois (et seulement après) que l'utilisateur a répondu "C'est parfait" ou a validé ton récapitulatif, félicite-le et propose-lui d'accéder AU mockup de la pièce demandée (et uniquement celle-là) via "__SHOW_MOCKUP_SELECTOR:TYPE__". Remplace TYPE par le vêtement précis validé (ex: hoodie, tshirt, sweat).
- TON EXPERT : Ne sois pas un simple exécutant. Si l'utilisateur veut un truc "bateau", challenge-le avec les données de "Viral sur TikTok" pour qu'il crée une pièce qui va vraiment percer.
- SUGGESTIONS DYNAMIQUES : À la fin de chaque étape, propose des suggestions pertinentes. Pour le récapitulatif final, propose obligatoirement : [[C'est parfait|Modifier un détail]].

DÉBUT DE CONVERSATION :
Si c'est le premier message (historique contenant "__INIT__"), présente-toi comme Pharell, Directeur Artistique. Explique que tu vas l'aider à bâtir une collection cohérente et rentable, mais qu'on ne fait rien au hasard ici. Demande-lui quelle est la toute première pièce qu'il a en tête pour lancer sa marque. [[Un T-shirt|Un Hoodie|Un Sweatshirt]]`;

        let filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__'
                ? "Salut Pharell, par où commencer pour les mockups ?"
                : m.content,
        }));

        if (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
            filteredMessages = filteredMessages.slice(1);
        }

        if (filteredMessages.length === 0) {
            filteredMessages = [{ role: 'user', content: "Salut" }];
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
                    messages: filteredMessages as any,
                });
                return response.content[0].type === 'text' ? response.content[0].text : '';
            },
            { brandId, agent: 'pharell' }
        );

        // Save conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'pharell', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'pharell', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Pharell Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[mockup-chat] Error payload:', error);
        const message = error.message || '';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        if (isQuota) return NextResponse.json({ error: message }, { status: 403 });
        return NextResponse.json({
            error: 'Pharrell rencontre un petit souci technique. Réessaie dans un instant.'
        }, { status: 500 });
    }
}
