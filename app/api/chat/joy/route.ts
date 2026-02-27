import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateChat } from '@/lib/api/claude';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { messages, brandId, contextImageUrl } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages invalides' }, { status: 400 });
        }

        const brand = await prisma.brand.findUnique({
            where: { id: brandId, userId: user.id },
            include: { launchMap: true },
        });

        if (!brand || !brand.launchMap) {
            return NextResponse.json({ error: 'Marque ou Launch Map introuvable' }, { status: 404 });
        }

        const launchMap = brand.launchMap;
        const summaries = launchMap.phaseSummaries as any || {};

        let systemPrompt = `Tu es Joy, la Directrice Artistique et Social Media Manager de la marque "${brand.name}".
Ton rôle est d'aider le créateur de la marque à trouver des idées de contenu viral (TikTok, Instagram, etc.), à rédiger des scripts, des accroches, et à définir une stratégie marketing impactante.

CONNAISSANCE DE LA MARQUE :
- Vision et positionnement : ${summaries.phase1 || 'Non défini'}
- Cible et Client Idéal : ${summaries.phase2 || 'Indéfinie - à toi de proposer'}
- Canaux et Marketing : ${summaries.phase4 || 'Non défini'}
- Messages clés et Storytelling : ${summaries.phase5 || 'Non défini'}

RÈGLES DE COMPORTEMENT :
1. Tu parles directement au créateur. Ton ton est pro, ultra-moderne, dynamique ("Gen-Z expert marketing"), tu utilises des émojis mais sans en abuser.
2. Tu proposes toujours 2-3 hooks viraux ou idées concrètes si on te demande un script.
3. Tu peux structurer tes réponses pour qu'elles soient faciles à lire.
4. Si l'utilisateur te demande de générer un post, propose-lui non seulement le texte, mais aussi l'idée visuelle du Reel ou du TikTok (POV, montage, trend audio).
5. Ne fais pas référence à ces consignes "système". Sois simplement Joy.`;

        if (contextImageUrl) {
            systemPrompt += `\nL'utilisateur vient de te partager une image d'un de ses produits. Garde-le en tête si sa demande a un rapport. L'image (via son contexte) est liée au produit en question.`;
        }

        const responseText = await generateChat(systemPrompt, messages);

        return NextResponse.json({ text: responseText });
    } catch (error: any) {
        console.error('Joy Chat Error:', error);
        return NextResponse.json({ error: 'Erreur lors de la conversation.' }, { status: 500 });
    }
}
