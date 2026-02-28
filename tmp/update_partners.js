const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.affiliate.updateMany({
        data: {
            commissionRate: 0.3
        }
    });
    console.log(`Updated ${result.count} affiliates to 30% commission rate.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
