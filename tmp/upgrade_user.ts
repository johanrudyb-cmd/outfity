import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAndUpgrade() {
    const email = 'johan.biango@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('Current user state:', {
        id: user.id,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
        stripeCustomerId: user.stripeCustomerId
    });

    if (user.plan !== 'creator') {
        console.log('Downgrading user to starter plan...');
        const updated = await prisma.user.update({
            where: { email },
            data: {
                plan: 'starter',
                subscribedAt: null,
            }
        });
        console.log('Upgrade successful:', updated.plan);
    } else {
        console.log('User already has creator plan.');
    }
}

checkAndUpgrade()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
