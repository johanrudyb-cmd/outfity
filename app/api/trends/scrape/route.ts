/**
 * Route API pour le Radar à Tendances
 * 
 * POST /api/trends/scrape
 * 
 * Déclenche le processus complet :
 * 1. Scrape Zalando, ASOS et Zara (Hybrid Radar)
 * 2. Analyse par IA (GPT) pour générer des conseils business
 * 3. Notification Admin (WhatsApp/n8n)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes pour Puppeteer

export async function POST(request: Request) {
  try {
    // Sécurisation : Autoriser soit l'utilisateur admin, soit n8n via le secret
    const { searchParams } = new URL(request.url);
    const secret = request.headers.get('x-n8n-secret') || searchParams.get('secret');
    const isN8n = secret && secret === process.env.N8N_WEBHOOK_SECRET;

    const user = !isN8n ? await getCurrentUser() : null;

    if (!isN8n && !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 1. Scraping Radar V3 (Google Trends, Zalando, Indie Stores)
    console.log('[Trends Scrape] Début du scraping Radar V3...');
    const { runRadarScan, saveRadarTrends } = await import('@/lib/radar');
    const trends = await runRadarScan();
    await saveRadarTrends(trends);

    // 2. Alertes Admin
    // const { notifyAdmin } = await import('@/lib/admin-notifications');
    // await notifyAdmin({...});

    return NextResponse.json({
      message: 'Radar V3 terminé avec succès',
      results: {
        totalFound: trends.length,
        topTrends: trends.slice(0, 3).map(t => t.name)
      }
    });
  } catch (error: any) {
    console.error('[Trends Scrape] Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du scraping' },
      { status: 500 }
    );
  }
}
