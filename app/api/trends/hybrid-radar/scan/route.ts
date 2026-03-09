/**
 * Trend Radar Hybride (Mondial) - Scan
 * POST /api/trends/hybrid-radar/scan
 *
 * 1. Collecte image + titre + prix (20 produits "New In" par source)
 * 2. Analyse IA (coupe, attributs, score tendance)
 * 3. Stockage TrendProduct avec marketZone
 * 4. Corrélation multi-zones → badge Global Trend Alert
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { runRadarScan, saveRadarTrends } = await import('@/lib/radar');
    const trends = await runRadarScan();
    await saveRadarTrends(trends);

    return NextResponse.json({
      message: 'Radar V3 manuel terminé avec succès',
      totalSaved: trends.length
    });
  } catch (e) {
    console.error('[Manual Radar Scan]', e);
    return NextResponse.json({ error: 'Erreur lors du scan manuel' }, { status: 500 });
  }
}

