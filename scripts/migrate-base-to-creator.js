
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count({ where: { plan: 'base' } });
    console.log(`Found ${count} users with plan 'base'`);

    if (count > 0) {
        const updated = await prisma.user.updateMany({
            where: { plan: 'base' },
            data: { plan: 'creator' }
        });
        console.log(`Updated ${updated.count} users from 'base' to 'creator'`);
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
