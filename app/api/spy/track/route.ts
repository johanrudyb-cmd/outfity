/**
 * API pour activer/désactiver le tracking d'une marque
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// POST - Activer le tracking d'une marque
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { url, name } = await request.json();

    if (!url || !name) {
      return NextResponse.json(
        { error: 'URL et nom requis' },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour la marque
    const fashionBrand = await prisma.fashionBrand.upsert({
      where: {
        userId_url: {
          userId: user.id,
          url,
        },
      },
      create: {
        userId: user.id,
        name,
        url,
        isTrackingActive: true,
      },
      update: {
        isTrackingActive: true,
        name,
      },
    });

    return NextResponse.json({ brand: fashionBrand });
  } catch (error: any) {
    console.error('Erreur lors de l\'activation du tracking:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'activation du tracking' },
      { status: 500 }
    );
  }
}

// DELETE - Désactiver le tracking
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId requis' },
        { status: 400 }
      );
    }

    await prisma.fashionBrand.update({
      where: { id: brandId, userId: user.id },
      data: { isTrackingActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la désactivation du tracking:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la désactivation' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les données de tracking d'une marque
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL requise' },
        { status: 400 }
      );
    }

    const brand = await prisma.fashionBrand.findUnique({
      where: {
        userId_url: {
          userId: user.id,
          url,
        },
      },
      include: {
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 168, // 7 jours * 24h = 168 snapshots (si horaire)
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ brand: null, tracking: false });
    }

    // Calculer les données pour le graphique 7 jours
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const snapshots7Days = brand.snapshots.filter(
      (s: { timestamp: Date }) => s.timestamp >= last7Days
    );

    const dailyData = snapshots7Days.reduce((acc: Record<string, { sales: number; revenue: number }>, snapshot: { timestamp: Date; salesDiff: number; revenueDiff: number }) => {
      const date = snapshot.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sales: 0, revenue: 0 };
      }
      acc[date].sales += snapshot.salesDiff;
      acc[date].revenue += snapshot.revenueDiff;
      return acc;
    }, {});

    const chartData = Object.entries(dailyData).map(([date, data]: [string, { sales: number; revenue: number }]) => ({
      date,
      sales: data.sales,
      revenue: data.revenue,
    }));

    return NextResponse.json({
      brand,
      tracking: brand.isTrackingActive,
      chartData: chartData.sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération du tracking:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
