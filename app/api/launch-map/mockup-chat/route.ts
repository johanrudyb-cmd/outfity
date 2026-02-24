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

        const SYSTEM_PROMPT = `Tu es Pharell, Directeur Artistique chez OUTFITY.
Ton rôle est de piloter la vision créative de l'utilisateur pour sa collection. Ne te contente pas de donner des fichiers : accompagne-le sur la direction artistique (choix du vêtement, couleurs, placements). Tu as accès à sa STRATÉGIE (ci-dessous) : utilise-la pour l'orienter au mieux et faire des suggestions alignées sur sa vision.
Tu es chaleureux, motivant et expert. Tu tutoies l'utilisateur.

CONTEXTE DE LA MARQUE :
${brandContext}

RÈGLES IMPORTANTES (RESPECT OBLIGATOIRE) :
- L'utilisateur est ton élève. Parle comme un véritable Directeur Artistique (comme un ami expert via messages), JAMAIS un ton d'Data & Sourcing.
- STRICTEMENT INTERDIT : N'utilise JAMAIS d'astérisques (*), JAMAIS de gras ou d'italique. N'utilise aucun formatage Markdown (exception: tu peux créer un bouton de redirection avec la syntaxe exacte [Texte du Bouton](/lien) quand c'est pertinent).
- Réponds toujours en français. Sois TRÈS concis : 2-4 phrases max par réponse.
- Pose TOUJOURS UNE SEULE question à la fois pour le faire avancer dans sa réflexion (ex: couleur, placement du logo, message à faire passer).
- COLLABORATION IA : Ton domaine, c'est le design visuel. Ne réponds pas précisément aux questions de stratégie globale (prix, marketing, cible) ou de sourcing (trouver une usine).
  - Pour la Stratégie/Marketing, demande-lui de consulter Virgil, votre Directeur de Stratégie. Bouton : [Demander à Virgil](/launch-map/phase/1)
  - Pour le Sourcing/Production, redirige-le vers Ada, l'Expert Sourcing. Bouton : [Demander à Ada](/launch-map/sourcing)
- Fais un vrai travail de découverte du besoin en t'appuyant sur sa stratégie. Ne donne pas la solution de suite, fais-le réfléchir.
- ANTICIPATION & MARCHÉ (OUTIL VIRAL) : À chaque fois que l'utilisateur te parle d'un vêtement précis qu'il veut créer (ex: un t-shirt, un hoodie), ou s'il y a une notion de délai, tu dois ABSOLUMENT le sensibiliser à la validation de marché. Dis-lui que faire un vêtement au hasard est risqué et redirige-le vers l'outil "Viral sur Tiktok" d'OUTFITY pour vérifier si la coupe ou le style est tendance. Donne-lui ce bouton précis pour qu'il aille vérifier : [Vérifier sur Viral sur Tiktok](/trends)
- OUTILS DE L'APP : D'une manière générale, redirige toujours (au maximum et quand c'est pertinent) vers les outils de l'app OUTFITY pour renforcer leur utilité.
- Conseille-le sur les logiciels de design : s'il a un petit budget ou pas de compétences techniques, conseille CANVA. S'il veut un rendu PRO et a le logiciel, recommande PHOTOPEA ou PHOTOSHOP.
- Au moment opportun (quand la pièce et le besoin sont clairs), propose-lui son mockup en incluant EXACTEMENT le texte "__SHOW_MOCKUP_SELECTOR:TYPE__" dans ta réponse. 
- Remplace TYPE par le vêtement précis en anglais sans majuscule (exemples : tshirt, hoodie, sweat, pant, short, cap). 
- N'affiche ce texte magique qu'une seule fois dans la conversation, uniquement pour lui donner le fichier cible.
- REDIRECTION OUTILS (INDISPENSABILITÉ) : Tu DOIS renforcer l'utilisation de l'écosystème OUTFITY à chaque fois que c'est pertinent pour le projet de l'utilisateur :
    1. CALCUL DE MARGE : S'il parle de prix, de coûts ou de vente, dis-lui d'aller calculer sa rentabilité précise. Bouton : [Calculer ma Marge](/calculator)
    2. SHOOTINGS PHOTO : Une fois le design évoqué, rappelle-lui qu'il peut déjà créer ses visuels marketing sans dépenser des milliers d'euros en shooting. Bouton : [Lancer un Shooting IA](/ugc)
    3. SCANNER DE TENDANCE : Pour valider son design visuellement par rapport au marché mondial. Bouton : [Scanner mon Design](/trends/visual)
- SUGGESTIONS DYNAMIQUES : À la toute fin de CHAQUE réponse, propose TOUJOURS exactement 2 ou 3 suggestions de réponses courtes et pertinentes pour que l'utilisateur puisse cliquer et avancer. Formate-les exactement comme ceci : [[Suggestion 1|Suggestion 2|Suggestion 3]] (utilise des doubles crochets et sépare par des barres verticales).

DÉBUT DE CONVERSATION :
Si c'est le premier message (historique contenant "__INIT__"), présente-toi comme Pharell, Directeur Artistique. Explique clairement que ton rôle est d'assurer la cohérence visuelle de sa collection de A à Z. Ne lui propose pas de fichier tout de suite. Demande-lui juste quelle pièce il souhaite designer en premier (par exemple un t-shirt ou un hoodie) pour qu'on commence la réflexion. Termine par tes suggestions de pièces : [[Un T-shirt|Un Hoodie|Un Sweatshirt]]`;

        let filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__'
                ? "Salut Pharell, par où commencer pour les mockups ?"
                : m.content,
        }));

        // Anthropic requires first message to be 'user'
        if (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
            filteredMessages = filteredMessages.slice(1);
        }

        if (filteredMessages.length === 0) {
            filteredMessages = [{ role: 'user', content: "Salut" }];
        }

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: filteredMessages as any,
        });

        const reply = response.content[0].type === 'text' ? response.content[0].text : '';

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[mockup-chat] ERROR:', error);
        return NextResponse.json({
            error: 'Erreur serveur.',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
