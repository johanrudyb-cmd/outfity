import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser } from '@/lib/rate-limit';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { generateChat } from '@/lib/api/chatgpt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { success } = await rateLimitByUser(currentUser.id, 'sourcing-chat', {
            maxRequests: 20,
            windowMs: 60000,
        });
        if (!success) {
            return NextResponse.json({ error: 'Trop de requêtes, veuillez patienter un instant.' }, { status: 429 });
        }

        const contentType = req.headers.get('content-type') || '';
        let brandId: string;
        let messages: { role: 'user' | 'assistant'; content: string }[];
        let imageOptions: { base64: string, mimeType: string } | undefined = undefined;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            brandId = formData.get('brandId') as string;
            messages = JSON.parse(formData.get('messages') as string);
            const file = formData.get('techPack') as File | null;
            if (file) {
                const buffer = await file.arrayBuffer();
                imageOptions = {
                    base64: Buffer.from(buffer).toString('base64'),
                    mimeType: file.type || 'image/jpeg'
                };
            }
        } else {
            const body = await req.json();
            brandId = body.brandId;
            messages = body.messages;
        }

        if (!brandId || !messages?.length) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id },
            include: { launchMap: true },
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

        const latestStrategy = await prisma.strategyGeneration.findFirst({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            select: { strategyText: true, positioning: true },
        });

        if (!latestStrategy?.strategyText) {
            return NextResponse.json({
                reply: "C'est Ada. Je peux t'aider à trouver l'usine parfaite, mais pour ça j'ai besoin de savoir ce que tu veux produire et pour qui. Virgil doit d'abord définir la stratégie. [Définir ma stratégie avec Virgil](/launch-map/phase/1)"
            });
        }

        const factories = await prisma.factory.findMany({
            take: 10,
            orderBy: { rating: 'desc' }
        });

        const internalCatalog = factories.map(f =>
            `- ${f.name} (${f.country}) | MOQ: ${f.moq} | Note: ${f.rating ?? '?'}/5 | Spécialités: ${(f.specialties as string[]).join(', ')}`
        ).join('\n');

        const sg = brand.styleGuide as Record<string, unknown> | null;
        const isPro = ['creator', 'pro', 'enterprise', 'admin'].includes(currentUser.plan || '');

        const brandContext = [
            `Marque : ${brand.name}`,
            `Positionnement : ${latestStrategy.positioning || 'À préciser'}`,
            `Produit cible : ${sg?.productType || 'À définir'}`,
            `Grammage : ${sg?.productWeight || 'À définir'}`,
            `Plan : ${currentUser.plan}`
        ].join('\n');

        const SYSTEM_PROMPT = `Tu es Ada, Experte Sourcing et Production Textile chez OUTFITY. Tu aides ${brand.name} à trouver les bons partenaires de fabrication.

Ton style de communication :
Tu parles comme une professionnelle du textile qui connaît ses usines, ses matières et ses certifications sur le bout des doigts. Tu tutoies. Tu es directe et méthodique. Tu n'utilises pas d'emojis pour meubler. Tu poses tes questions dans un ordre précis parce que la qualification d'un besoin de production ne se fait pas à l'arrache. Quand tu parles technique — GSM, Jersey, MOQ, OEKO-TEX — tu expliques ce que ça veut dire concrètement si la personne ne semble pas à l'aise avec ces termes.

Contexte de la marque :
${brandContext}

Catalogue interne (confidentiel) :
${internalCatalog}

Règles :
1. Qualification en 5 étapes dans cet ordre exact : (1) Type de vêtement précis → (2) Tech pack disponible ? → (3) Matière et grammage souhaités → (4) Volume de production (MOQ) → (5) Budget et délai. Tu ne passes à l'étape suivante qu'une fois la précédente répondue. Une seule question à la fois.
2. Confidentialité du catalogue : ${isPro ? 'Tu peux recommander des usines spécifiques une fois le besoin bien qualifié.' : 'Tu ne donnes pas de noms d\'usines en plan gratuit. Tu aides l\'utilisateur à préparer son dossier. Pour accéder au catalogue complet, c\'est le plan Creator.'}
3. Si l'utilisateur envoie une image de tech pack, analyse-la : identifie la coupe, les détails de construction, les zones de placement pour accélérer la qualification.
4. Pour les questions sur le design, renvoie vers Pharell. Pour la stratégie, renvoie vers Virgil.
5. Termine toujours par : [[Option A|Option B|Option C]]

Ouverture (si message est "__INIT__") :
Dis : "C'est Ada. Je vais t'aider à trouver le bon partenaire de fabrication pour ${brand.name}. Pour commencer : quel type de vêtement tu veux produire en premier ?"`;

        const filteredMessages = messages.map(m => ({
            role: m.role,
            content: m.content === '__INIT__' ? 'Démarre la conversation.' : m.content,
        }));

        const reply = await withAIUsageLimit(
            currentUser.id,
            currentUser.plan,
            'assistant_chat_qa',
            () => generateChat(SYSTEM_PROMPT, filteredMessages, {
                model: 'gpt-4o-mini',
                temperature: 0.6,
                maxTokens: 1000,
                image: imageOptions
            }),
            { brandId, agent: 'ada' }
        );

        try {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage?.role === 'user') {
                await prisma.agentMessage.createMany({
                    data: [
                        { brandId, agentKey: 'ada', role: 'user', content: lastUserMessage.content === '__INIT__' ? 'Initialisation' : lastUserMessage.content },
                        { brandId, agentKey: 'ada', role: 'assistant', content: reply }
                    ]
                });
            }
        } catch (e) {
            console.warn('[Ada] Save error:', e);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('[sourcing-chat] Error:', error);
        return NextResponse.json({ error: 'Ada est indisponible.' }, { status: 500 });
    }
}
