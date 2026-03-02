export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache 5 minutes — les tendances ne changent pas à la seconde
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    // On ignore ageRange volontairement pour tout afficher
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Conditions de base
    const where: any = {};
    if (segment) {
      where.segment = segment;
    }

    // Récupération avec select strict pour réduire le payload (~70% plus léger)
    const products = await prisma.trendProduct.findMany({
      where,
      orderBy: { trendScore: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        style: true,
        trendScore: true,
        imageUrl: true,
        segment: true,
        averagePrice: true,
        saturability: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Hybrid Radar: Found ${products.length} products for segment ${segment}`);
    }

    const response = NextResponse.json({
      trends: products,
      summary: { total: products.length },
    });
    // Cache CDN Vercel : frais 5 min, stale jusqu'à 10 min
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ trends: [], error: 'Failed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
