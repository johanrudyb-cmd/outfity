/**
 * Script pour changer le plan d'un utilisateur (pour tests)
 * 
 * Usage: node scripts/upgrade-user-plan.js <email> <plan>
 * Plans disponibles: free, pro, enterprise
 * Exemple: node scripts/upgrade-user-plan.js user@example.com pro
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function upgradePlan() {
  const email = process.argv[2];
  const plan = process.argv[3] || 'enterprise'; // Par défaut enterprise pour tests illimités

  if (!email) {
    console.error('❌ Veuillez fournir un email');
    console.log('Usage: node scripts/upgrade-user-plan.js <email> [plan]');
    console.log('Plans: free (5 analyses), pro (20 analyses), enterprise (illimité)');
    console.log('Exemple: node scripts/upgrade-user-plan.js user@example.com enterprise');
    process.exit(1);
  }

  const validPlans = ['free', 'starter', 'creator', 'pro', 'enterprise'];
  if (!validPlans.includes(plan)) {
    console.error(`❌ Plan invalide. Plans disponibles: ${validPlans.join(', ')}`);
    process.exit(1);
  }

  try {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Utilisateur avec l'email "${email}" non trouvé`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé: ${user.email}`);
    console.log(`📦 Plan actuel: ${user.plan}`);

    // Mettre à jour le plan
    const updated = await prisma.user.update({
      where: { email },
      data: { plan },
    });

    console.log(`✅ Plan mis à jour: ${updated.plan}`);

    const limits = {
      free: 5,
      pro: 20,
      enterprise: 'illimité',
    };

    console.log(`📊 Limite d'analyses: ${limits[plan]}`);
    console.log('\n🎉 Vous pouvez maintenant tester!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('MaxClientsInSessionMode')) {
      console.error('\n💡 Solution:');
      console.error('   1. Arrêtez le serveur de développement (Ctrl+C dans le terminal où npm run dev est lancé)');
      console.error('   2. Attendez quelques secondes');
      console.error('   3. Relancez cette commande');
      console.error('\n   Ou utilisez Prisma Studio: npm run db:studio');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

upgradePlan();
