
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count({ where: { plan: 'free' } });
    console.log(`Found ${count} users with plan 'free'`);

    if (count > 0) {
        const updated = await prisma.user.updateMany({
            where: { plan: 'free' },
            data: { plan: 'starter' }
        });
        console.log(`Updated ${updated.count} users from 'free' to 'starter'`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
