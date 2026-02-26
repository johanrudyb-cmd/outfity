/**
 * Enregistrer en base les produits d'une prévisualisation (sans re-scraper).
 * POST /api/trends/hybrid-radar/save-from-preview
 * Body: { sourceId, brand, marketZone, segment, items: [{ name, price, imageUrl, sourceUrl, trendGrowthPercent?, trendLabel?, ... }] }
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { computeSaturability, computeTrendScore } from '@/lib/trend-product-kpis';
import { inferCategory } from '@/lib/infer-trend-category';
import { cleanProductTitle } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { broadcastWebPushNotification } from '@/lib/web-push';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sourceId = (body.sourceId as string)?.trim();
    const brand = (body.brand as string)?.trim();
    const marketZone = ((body.marketZone as string)?.trim()) || 'EU';
    const segment = ((body.segment as string)?.trim()) || 'homme';
    const items = Array.isArray(body.items) ? body.items : [];
    const defaultTrendPercent =
      typeof body.defaultTrendPercent === 'number' && body.defaultTrendPercent >= 0 && body.defaultTrendPercent <= 100
        ? Math.round(body.defaultTrendPercent)
        : undefined;

    if (!sourceId || !brand) {
      return NextResponse.json(
        { error: 'sourceId et brand requis' },
        { status: 400 }
      );
    }

    const isValidProductUrl = (url: string) => {
      if (typeof url !== 'string' || url.length <= 5) return false;
      const u = url.trim();
      if (u.includes('/p/') || u.includes('.html')) return true;
      if (brand === 'Zalando' && u.includes('/trend-spotter/trending-items')) return true;
      if (brand === 'ASOS') {
        if (u.includes('/prd/')) return true;
        if (u.startsWith('/') && u.includes('/prd/')) return true;
        if (u.includes('/preview/')) return true; // URL synthétique (liste sans lien produit)
        if (u.includes('asos.com') || u.includes('asos.')) {
          const pathSegments = u.replace(/^https?:\/\//i, '').split('/').filter(Boolean);
          if (pathSegments.length >= 3) return true;
        }
      }
      return false;
    };

    const seenUrls = new Set<string>();
    const toSave: { url: string; item: (typeof items)[number]; index: number }[] = [];
    let skippedNoUrl = 0;
    let skippedInvalidUrl = 0;
    let skippedDuplicate = 0;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (!item.name || !String(item.name).trim()) continue;
      let rawUrl = (item.sourceUrl ?? '').trim();
      // ASOS : URL de page catégorie (sans /prd/) = pas d’URL produit → URL synthétique unique par article
      // ASOS : toujours une URL synthétique unique par article (on ne s'appuie jamais sur l'URL envoyée)
      if (brand === 'ASOS' && item.name) {
        rawUrl = `https://www.asos.com/preview/${encodeURIComponent(String(item.name).slice(0, 80))}-${index}`;
      }
      if (!rawUrl) {
        skippedNoUrl++;
        continue;
      }
      if (!isValidProductUrl(rawUrl)) {
        skippedInvalidUrl++;
        continue;
      }
      const url = rawUrl.trim();
      if (seenUrls.has(url)) {
        skippedDuplicate++;
        continue;
      }
      seenUrls.add(url);
      toSave.push({ url, item, index });
    }

    // ASOS : remplacer les anciens par les nouveaux (supprimer les produits de cette source pour éviter doublons)
    if (brand === 'ASOS' && toSave.length > 0) {
      const deleted = await prisma.trendProduct.deleteMany({
        where: {
          sourceBrand: 'ASOS',
          marketZone,
          segment: segment ?? null,
        },
      });
      if (deleted.count > 0) {
        console.log(`[Save From Preview] ASOS: ${deleted.count} ancien(s) produit(s) supprimé(s) avant enregistrement`);
      }
    }

    const urls = toSave.map((t) => t.url);
    const existingList = urls.length > 0
      ? await prisma.trendProduct.findMany({
        where: { sourceUrl: { in: urls }, marketZone, sourceBrand: brand },
        select: { id: true, sourceUrl: true },
      })
      : [];
    const existingByUrl = new Map(existingList.map((e) => [e.sourceUrl ?? '', e.id]));
    let savedCount = 0;

    for (const { url, item, index } of toSave) {
      const existingId = existingByUrl.get(url);
      const cleanName = (cleanProductTitle(String(item.name)) || String(item.name)).trim().slice(0, 500);
      if (!cleanName) continue;
      const category = inferCategory(item.name);
      const material = (item.composition as string) || 'Non spécifié';
      const descParts: string[] = [];
      if (item.composition) descParts.push(`Composition: ${item.composition}`);
      if (item.careInstructions) descParts.push(`Entretien: ${item.careInstructions}`);
      if (item.color) descParts.push(`Couleur: ${item.color}`);
      if (item.sizes) descParts.push(`Tailles: ${item.sizes}`);
      if (item.countryOfOrigin) descParts.push(`Origine: ${item.countryOfOrigin}`);
      if (item.articleNumber) descParts.push(`Ref: ${item.articleNumber}`);
      const description = descParts.length > 0 ? descParts.join('\n') : null;
      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
      let trendGrowthPercent = item.trendGrowthPercent ?? null;
      let trendLabel = item.trendLabel ?? null;
      if (trendGrowthPercent == null && defaultTrendPercent != null) {
        trendGrowthPercent = defaultTrendPercent;
        trendLabel = trendLabel || 'Tendance';
      }
      const productBrand = item.productBrand ?? (brand !== 'Zalando' && brand !== 'ASOS' ? brand : null);
      const scrapedFields = {
        color: item.color ?? null,
        sizes: item.sizes ?? null,
        countryOfOrigin: item.countryOfOrigin ?? null,
        articleNumber: item.articleNumber ?? null,
        careInstructions: item.careInstructions ?? null,
        markdownPercent: item.markdownPercent ?? null,
        stockOutRisk: item.stockOutRisk ?? null,
        productBrand: productBrand ?? null,
      };

      if (existingId) {
        await prisma.trendProduct.update({
          where: { id: existingId },
          data: {
            name: cleanName,
            category,
            material,
            averagePrice: price,
            imageUrl: item.imageUrl ?? null,
            description,
            segment: segment ?? null,
            trendGrowthPercent,
            trendLabel,
            ...scrapedFields,
          },
        });
      } else {
        const saturability = computeSaturability(trendGrowthPercent, trendLabel, 0);
        const trendScore = computeTrendScore(trendGrowthPercent, trendLabel);
        await prisma.trendProduct.create({
          data: {
            name: cleanName,
            category,
            style: '',
            material,
            averagePrice: price,
            trendScore,
            saturability,
            imageUrl: item.imageUrl ?? null,
            description,
            marketZone,
            sourceBrand: brand,
            sourceUrl: url,
            segment: segment ?? null,
            trendGrowthPercent,
            trendLabel,
            trendScoreVisual: trendScore,
            ...scrapedFields,
          },
        });
      }
      savedCount++;
    }

    const skippedTotal = skippedNoUrl + skippedInvalidUrl + skippedDuplicate;
    console.log('[Save From Preview] result:', { savedCount, skippedNoUrl, skippedInvalidUrl, skippedDuplicate, toSaveLength: toSave.length });

    // Si on a enregistré des nouvelles tendances, envoyer une notification PUSH
    if (savedCount > 0) {
      try {
        await broadcastWebPushNotification({
          title: "📈 Radar Tendance Mis à jour",
          body: `${savedCount} Nouveaux articles Viraux ajoutés ! Va voir ça 🔥`,
          url: "/trends"
        });
      } catch (err) {
        console.error("Erreur push tendance:", err);
      }
    }

    const message =
      savedCount > 0
        ? `${savedCount} tendance(s) enregistrée(s) pour ${sourceId}.`
        : skippedTotal > 0
          ? `Aucune tendance enregistrée. ${skippedTotal} article(s) ignoré(s) (${skippedNoUrl} sans URL, ${skippedInvalidUrl} URL non valide, ${skippedDuplicate} doublon).`
          : items.length === 0
            ? 'Aucun article à enregistrer.'
            : 'Aucune tendance enregistrée.';
    if (skippedTotal > 0 || (savedCount === 0 && items.length > 0)) {
      console.log(
        `[Save From Preview] ${sourceId}: saved=${savedCount}, skipped: noUrl=${skippedNoUrl}, invalidUrl=${skippedInvalidUrl}, duplicate=${skippedDuplicate}`
      );
    }

    return NextResponse.json({
      message,
      savedToTrends: savedCount,
      skipped: skippedTotal > 0 ? { total: skippedTotal, noUrl: skippedNoUrl, invalidUrl: skippedInvalidUrl, duplicate: skippedDuplicate } : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur';
    console.error('[Save From Preview]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
