import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateChat } from '@/lib/api/claude';
import { withAIUsageLimit } from '@/lib/ai-usage';

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

        if (!brand) {
            return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });
        }

        const summaries = (brand.launchMap as any)?.phaseSummaries || {};

        let systemPrompt = `Tu es Joy (DA & Réseaux Sociaux). Tu parles comme une humaine sur WhatsApp.
RÈGLES VITALES :
1. TEXTE BRUT UNIQUEMENT : Interdiction absolue d'utiliser du gras (**), des titres (##), des listes (•) ou des tirets. Écris comme tu parlerais.
2. ZERO EMOJI : Aucun émoji, jamais.
3. STYLE DIRECT : Pas de "Voici des options", pas de politesse d'IA.
INITIALISATION : "Salut, c'est Joy. On va faire de ${brand.name} la prochaine marque qui explose. On attaque par quoi ?"`;

        if (contextImageUrl) {
            systemPrompt += `\nL'utilisateur vient de te partager une image d'un de ses produits. Garde-le en tête si sa demande a un rapport. L'image (via son contexte) est liée au produit en question.`;
        }

        const responseText = await withAIUsageLimit(
            user.id,
            user.plan,
            'assistant_chat_qa',
            () => generateChat(systemPrompt, messages),
            { brandId, agent: 'joy' }
        );

        // Sauvegarder la conversation
        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        {
                            brandId,
                            agentKey: 'joy',
                            role: 'user',
                            content: lastUserMessage.content,
                        },
                        {
                            brandId,
                            agentKey: 'joy',
                            role: 'assistant',
                            content: responseText,
                        }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Joy Chat] Failed to save messages:', e);
        }

        return NextResponse.json({ text: responseText });
    } catch (error: any) {
        console.error('Joy Chat Error:', error);
        const message = error.message || 'Erreur lors de la conversation.';
        const isQuota = message.includes('Quota') || message.includes('Limite') || message.includes('épuisé');
        return NextResponse.json({ error: message }, { status: isQuota ? 403 : 500 });
    }
}
