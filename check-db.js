
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        select: { email: true, emailVerified: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('--- RECENT USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const tokens = await prisma.verificationToken.findMany({
        orderBy: { expires: 'desc' },
        take: 5
    });
    console.log('--- RECENT TOKENS ---');
    console.log(JSON.stringify(tokens, null, 2));

    await prisma.$disconnect();
}
check();
