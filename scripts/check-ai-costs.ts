
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const totalCost = await prisma.aIUsage.aggregate({
        _sum: {
            costEur: true
        }
    });

    const costByFeature = await prisma.aIUsage.groupBy({
        by: ['feature'],
        _sum: {
            costEur: true
        },
        orderBy: {
            _sum: {
                costEur: 'desc'
            }
        }
    });

    console.log('--- RÉCAPITULATIF DES COÛTS IA ---');
    console.log(`Coût Total: ${totalCost._sum.costEur?.toFixed(4) || 0} €`);
    console.log('\nDétail par fonctionnalité :');
    costByFeature.forEach(f => {
        console.log(`- ${f.feature}: ${f._sum.costEur?.toFixed(4)} €`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
