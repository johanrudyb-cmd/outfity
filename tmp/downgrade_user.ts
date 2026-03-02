import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function downgrade() {
    const email = 'johan.biango@gmail.com';
    console.log(`Downgrading user: ${email}`);

    const updated = await prisma.user.update({
        where: { email },
        data: {
            plan: 'starter',
            subscribedAt: null
        }
    });

    console.log('User status after downgrade:', {
        id: updated.id,
        plan: updated.plan
    });
}

downgrade()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
