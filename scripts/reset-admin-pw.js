const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
    const email = 'johanrudyb@gmail.com';
    const newPassword = 'AdminOutfity2026!'; // Temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    console.log(`Password reset successfully for ${email}`);
    console.log(`New temporary password: ${newPassword}`);
    await prisma.$disconnect();
}

resetAdminPassword().catch(console.error);
