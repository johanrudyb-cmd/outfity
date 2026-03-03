import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkArticles() {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const count = await prisma.blogPost.count({
        where: {
            published: true,
            publishedAt: {
                gte: twentyFourHoursAgo
            }
        }
    });

    const allRecent = await prisma.blogPost.findMany({
        where: {
            published: true,
            publishedAt: {
                gte: twentyFourHoursAgo
            }
        },
        select: { title: true, publishedAt: true }
    });

    console.log(`Articles trouvés (dernières 24h): ${count}`);
    console.log('Liste:', JSON.stringify(allRecent, null, 2));

    process.exit(0);
}

checkArticles().catch(err => {
    console.error(err);
    process.exit(1);
});
