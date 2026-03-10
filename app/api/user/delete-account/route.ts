import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function DELETE() {
    try {
        const authUser = await getCurrentUser();
        if (!authUser || !authUser.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { id: true, stripeCustomerId: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        // 1. Annuler l'abonnement Stripe en cours s'il existe
        if (stripe && user.stripeCustomerId) {
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'active',
                    limit: 10,
                });
                for (const sub of subscriptions.data) {
                    await stripe.subscriptions.cancel(sub.id);
                }
                // Annuler aussi les trials
                const trials = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'trialing',
                    limit: 10,
                });
                for (const sub of trials.data) {
                    await stripe.subscriptions.cancel(sub.id);
                }
            } catch (stripeErr) {
                console.error('[delete-account] Stripe cancel error (non-bloquant):', stripeErr);
                // Non-bloquant — on continue la suppression même si Stripe échoue
            }
        }

        // 2. Supprimer les ProductFavorites (pas de userId foreign key directe avec cascade)
        await prisma.productFavorite.deleteMany({ where: { userId: user.id } });

        // 3. Supprimer les Quotes liées aux brands de l'utilisateur
        const brands = await prisma.brand.findMany({
            where: { userId: user.id },
            select: { id: true },
        });
        const brandIds = brands.map(b => b.id);
        if (brandIds.length > 0) {
            await prisma.quote.deleteMany({ where: { brandId: { in: brandIds } } });
        }

        // 4. Nullifier l'authorId des BlogPosts (relation optionnelle, pas de cascade)
        await prisma.blogPost.updateMany({
            where: { authorId: user.id },
            data: { authorId: null },
        });

        // 5. Supprimer l'utilisateur — toutes les autres tables en cascade grâce à onDelete: Cascade
        await prisma.user.delete({ where: { id: user.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[delete-account]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur lors de la suppression' },
            { status: 500 }
        );
    }
}
