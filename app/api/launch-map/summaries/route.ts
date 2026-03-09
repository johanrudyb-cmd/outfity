/**
 * PATCH /api/launch-map/summaries
 * Body: { brandId: string, phaseSummaries: Record<string, string> }
 * Met à jour les résumés modifiables des phases (phaseSummaries sur LaunchMap).
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const brandId = typeof body.brandId === 'string' ? body.brandId.trim() : '';
    const phaseSummaries = body.phaseSummaries;
    const completedPhase = typeof body.completedPhase === 'number' ? body.completedPhase : null;

    if (!brandId) {
      return NextResponse.json({ error: 'brandId requis' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
      include: { launchMap: true },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });
    }

    const summaries =
      phaseSummaries && typeof phaseSummaries === 'object' && !Array.isArray(phaseSummaries)
        ? (phaseSummaries as Record<string, string>)
        : undefined;

    const updateData: any = {};
    if (summaries !== undefined) updateData.phaseSummaries = summaries;
    if (completedPhase !== null && completedPhase >= 1 && completedPhase <= 8) {
      updateData[`phase${completedPhase}`] = true;
    }

    const launchMap = await prisma.launchMap.upsert({
      where: { brandId },
      update: updateData,
      create: {
        brandId,
        phase1: completedPhase === 1,
        phase2: completedPhase === 2,
        phase3: completedPhase === 3,
        phase4: completedPhase === 4,
        phase5: completedPhase === 5,
        phase6: completedPhase === 6,
        phase7: completedPhase === 7,
        phase8: completedPhase === 8,
        phaseSummaries: summaries ?? undefined,
      },
      include: { brand: true },
    });

    return NextResponse.json({ success: true, launchMap });
  } catch (e) {
    console.error('[launch-map/summaries PATCH]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
