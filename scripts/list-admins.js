const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAdmins() {
    const adminEmails = ['contact@outfity.fr', 'johanrudyb@gmail.com'];
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { in: adminEmails } },
                { email: { endsWith: '@biangory.com' } }
            ]
        },
        select: {
            id: true,
            email: true,
            name: true,
            plan: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

listAdmins().catch(console.error);
