import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tokens = await prisma.verificationToken.findMany({
        orderBy: { expires: 'desc' },
        take: 3
    });
    console.log('--- RECENT TOKENS ---');
    console.log(JSON.stringify(tokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
