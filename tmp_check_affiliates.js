const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const affiliates = await prisma.affiliate.findMany({
        take: 5,
        select: { referralCode: true, name: true }
    });
    console.log(JSON.stringify(affiliates, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
