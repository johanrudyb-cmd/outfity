import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await getCurrentUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
            id: true,
            email: true,
            plan: true,
            onboardingCompleted: true,
            onboardingData: true,
            affiliate: {
                select: {
                    status: true,
                }
            }
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- LOGIQUE AUTO-LINK REHAUSSÉE ---
    // Si l'utilisateur n'est pas lié à un affilié via FK, mais qu'un record existe pour son email
    if (!user.affiliate && user.email) {
        const orphanAffiliate = await prisma.affiliate.findUnique({
            where: { email: user.email },
            select: { id: true, userId: true }
        });

        // S'il n'est pas déjà lié à quelqu'un d'autre
        if (orphanAffiliate && !orphanAffiliate.userId) {
            console.log(`[Plan API] Auto-linking partner found for email: ${user.email}`);
            const updatedAffiliate = await prisma.affiliate.update({
                where: { id: orphanAffiliate.id },
                data: {
                    userId: user.id,
                    status: 'ACTIVE'
                }
            });
            // On renvoie le statut mis à jour pour que le sidebar s'affiche immédiatement
            return NextResponse.json({
                ...user,
                affiliate: { status: updatedAffiliate.status }
            });
        }
    }

    return NextResponse.json(user);
}
