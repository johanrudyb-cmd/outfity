const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, plan: true, stripeCustomerId: true }
    });
    console.log('--- USER PLANS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email} | Plan: ${u.plan} | CustomerID: ${u.stripeCustomerId || 'None'}`);
    });
    await prisma.$disconnect();
}

checkPlans();
