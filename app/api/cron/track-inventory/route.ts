/**
 * API Route CRON pour le tracking dynamique des stocks et ventes
 * 
 * Cette route doit être appelée périodiquement (ex: toutes les heures)
 * pour tracker les changements de stocks et calculer les ventes
 * 
 * Sécurisation: Utilise CRON_SECRET dans .env
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

interface ProductInventory {
  [productId: string]: {
    quantity: number;
    price: number;
    title: string;
    variantId?: string;
  };
}

/**
 * Scrape le fichier products.json d'une boutique Shopify
 */
async function fetchProductsJson(shopifyUrl: string): Promise<ProductInventory> {
  try {
    // Normaliser l'URL
    const url = new URL(shopifyUrl);
    const productsJsonUrl = `${url.origin}/products.json`;

    const response = await fetch(productsJsonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!response.ok) {
      throw new Error(`Impossible de récupérer products.json: ${response.status}`);
    }

    const productsData = await response.json();
    const inventory: ProductInventory = {};

    // Transformer les données Shopify en format inventory
    if (productsData.products && Array.isArray(productsData.products)) {
      productsData.products.forEach((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any) => {
            const productId = `${product.id}-${variant.id}`;
            inventory[productId] = {
              quantity: variant.inventory_quantity || 0,
              price: parseFloat(variant.price) || 0,
              title: product.title,
              variantId: variant.id.toString(),
            };
          });
        }
      });
    }

    return inventory;
  } catch (error) {
    console.error(`[Track Inventory] Erreur lors du fetch de products.json pour ${shopifyUrl}:`, error);
    throw error;
  }
}

/**
 * Calcule les différences entre deux snapshots
 */
function calculateDiffs(
  previousInventory: ProductInventory,
  currentInventory: ProductInventory
): { salesDiff: number; revenueDiff: number } {
  let salesDiff = 0;
  let revenueDiff = 0;

  // Parcourir tous les produits du snapshot précédent
  Object.keys(previousInventory).forEach((productId) => {
    const previous = previousInventory[productId];
    const current = currentInventory[productId];

    if (current) {
      // Si le produit existe toujours, calculer la différence
      const quantityDiff = previous.quantity - current.quantity;

      // Si la quantité a diminué, c'est une vente
      if (quantityDiff > 0) {
        salesDiff += quantityDiff;
        revenueDiff += quantityDiff * current.price; // Utiliser le prix actuel
      }
    } else {
      // Si le produit n'existe plus, considérer tout le stock comme vendu
      salesDiff += previous.quantity;
      revenueDiff += previous.quantity * previous.price;
    }
  });

  return { salesDiff, revenueDiff };
}

/**
 * Handler GET pour le tracking (appelé par CRON)
 */
export async function GET(request: Request) {
  try {
    // Vérifier le secret CRON
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET non configuré');
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    // Vérifier l'autorisation (Vercel envoie le secret dans l'header)
    // Format: "Bearer <secret>" ou juste le secret dans x-cron-secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || request.headers.get('x-cron-secret');

    if (providedSecret !== cronSecret) {
      console.warn('[CRON] Tentative d\'accès non autorisée');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer toutes les marques avec tracking actif
    const activeBrands = await prisma.fashionBrand.findMany({
      where: { isTrackingActive: true },
    });

    console.log(`[Track Inventory] ${activeBrands.length} marque(s) à tracker`);

    const results = [];

    for (const brand of activeBrands) {
      try {
        console.log(`[Track Inventory] Traitement de ${brand.name} (${brand.url})`);

        // Récupérer le dernier snapshot
        const lastSnapshot = await prisma.storeSnapshot.findFirst({
          where: { brandId: brand.id },
          orderBy: { timestamp: 'desc' },
        });

        // Fetch products.json
        const currentInventory = await fetchProductsJson(brand.url);

        // Calculer les différences
        let salesDiff = 0;
        let revenueDiff = 0;

        if (lastSnapshot) {
          const previousInventory = lastSnapshot.inventoryData as ProductInventory;
          const diffs = calculateDiffs(previousInventory, currentInventory);
          salesDiff = diffs.salesDiff;
          revenueDiff = diffs.revenueDiff;
        }

        // Créer un nouveau snapshot
        const snapshot = await prisma.storeSnapshot.create({
          data: {
            brandId: brand.id,
            inventoryData: currentInventory,
            salesDiff,
            revenueDiff,
          },
        });

        // Mettre à jour les métriques 24h de la marque
        // Calculer les ventes/revenus des 24 dernières heures
        const last24h = new Date();
        last24h.setHours(last24h.getHours() - 24);

        const snapshots24h = await prisma.storeSnapshot.findMany({
          where: {
            brandId: brand.id,
            timestamp: { gte: last24h },
          },
        });

        const totalSales24h = snapshots24h.reduce((sum, s) => sum + s.salesDiff, 0);
        const totalRevenue24h = snapshots24h.reduce((sum, s) => sum + s.revenueDiff, 0);

        await prisma.fashionBrand.update({
          where: { id: brand.id },
          data: {
            lastSales24h: totalSales24h,
            lastRevenue24h: totalRevenue24h,
            updatedAt: new Date(),
          },
        });

        results.push({
          brand: brand.name,
          success: true,
          salesDiff,
          revenueDiff,
          totalSales24h,
          totalRevenue24h,
        });

        console.log(`[Track Inventory] ✅ ${brand.name}: ${salesDiff} ventes, ${revenueDiff.toFixed(2)}€ de revenu`);
      } catch (error: any) {
        console.error(`[Track Inventory] ❌ Erreur pour ${brand.name}:`, error.message);
        results.push({
          brand: brand.name,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Track Inventory] Erreur globale:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}
