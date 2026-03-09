/**
 * Analyse de marque IA - Enregistrée en base, identique pour tous les utilisateurs.
 * POST /api/brands/analyze
 * Body: { brandName: string, context?: { signaturePiece, dominantStyle, ... } }
 */

import { NextResponse } from 'next/server';
import { sanitizeErrorMessage } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth-helpers';
import { generateBrandAnalysis, getBrandQuickMetadata, isChatGptConfigured } from '@/lib/api/chatgpt';
import { generateBrandStrategyTemplate, generateVisualIdentityFromBrand, isClaudeConfigured } from '@/lib/api/claude';
import { prisma } from '@/lib/prisma';
import { CURATED_TOP_BRANDS } from '@/lib/curated-brands';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { fetchLogoForBrand } from '@/lib/brand-logo-fetch';

function isAnalyzeConfigured(): boolean {
  return isChatGptConfigured() || isClaudeConfigured();
}

export const runtime = 'nodejs';

function getBrandKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function brandNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/'/g, '-')
    .replace(/&/g, 'and');
}

/** GET ?list=1 — liste des grandes marques en base (pour le sélecteur stratégie). */
/** GET ?brandName= ou ?brandKey= — retourne l'analyse existante (pour la page dédiée). */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listOnly = searchParams.get('list') === '1';

    if (listOnly) {
      const styleParam = searchParams.get('style')?.trim().toLowerCase();
      const curatedWithStyle = CURATED_TOP_BRANDS.map((b) => ({
        brandName: b.brand,
        brandKey: b.brand.toLowerCase().trim().replace(/\s+/g, ' '),
        slug: brandNameToSlug(b.brand),
        dominantStyle: b.dominantStyle,
      }));
      const filteredByStyle = styleParam
        ? curatedWithStyle.filter(
          (b) =>
            b.dominantStyle?.toLowerCase().includes(styleParam) ||
            styleParam.split(/\s+/).some((s) => b.dominantStyle?.toLowerCase().includes(s))
        )
        : curatedWithStyle;
      const inDb = await prisma.brandAnalysis.findMany({
        orderBy: { brandName: 'asc' },
        select: { brandKey: true, brandName: true, logoUrl: true },
      });
      const fromDb = inDb.map((b) => ({
        brandName: b.brandName,
        brandKey: b.brandKey,
        slug: brandNameToSlug(b.brandName),
        logoUrl: b.logoUrl ?? undefined,
      }));
      const curatedSlugs = new Set(
        (styleParam ? filteredByStyle : curatedWithStyle).map((b) => b.slug.toLowerCase())
      );
      const extraFromDb = fromDb.filter((b) => !curatedSlugs.has(b.slug.toLowerCase()));
      const brands = [
        ...(styleParam ? filteredByStyle : curatedWithStyle).map(({ brandName, brandKey, slug }) => ({
          brandName,
          brandKey,
          slug,
        })),
        ...extraFromDb,
      ];
      return NextResponse.json({
        brands,
        analyzedBrands: extraFromDb,
        source: styleParam ? 'curated' : extraFromDb.length > 0 ? 'curated,database' : 'curated',
      });
    }

    const brandName = searchParams.get('brandName')?.trim();
    const brandKeyParam = searchParams.get('brandKey')?.trim();

    const brandKey = brandKeyParam ?? (brandName ? getBrandKey(brandName) : null);
    if (!brandKey) {
      return NextResponse.json(
        { error: 'brandName ou brandKey requis (ou ?list=1 pour la liste)' },
        { status: 400 }
      );
    }

    const existing = await prisma.brandAnalysis.findUnique({
      where: { brandKey },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Aucune analyse trouvée pour cette marque' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      brandName: existing.brandName,
      analysis: existing.analysis,
      visualIdentity: existing.visualIdentity ?? undefined,
      logoUrl: existing.logoUrl ?? undefined,
    });
  } catch (e) {
    console.error('[Brand Analysis GET]', e);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const brandName = (body.brandName || body.brand || '').trim();
    const context = body.context;

    if (!brandName || brandName.length < 2) {
      return NextResponse.json(
        { error: 'Nom de marque requis' },
        { status: 400 }
      );
    }

    const brandKey = getBrandKey(brandName);

    // 1. Chercher une analyse existante
    const existing = await prisma.brandAnalysis.findUnique({
      where: { brandKey },
    });

    if (existing) {
      return NextResponse.json({
        brandName: existing.brandName,
        analysis: existing.analysis,
        visualIdentity: existing.visualIdentity ?? undefined,
        logoUrl: existing.logoUrl ?? undefined,
      });
    }

    // 2. Générer et enregistrer si absente (Claude prioritaire, sinon GPT)
    if (!isAnalyzeConfigured()) {
      return NextResponse.json(
        { error: 'Une clé API IA est requise pour ce service.' },
        { status: 503 }
      );
    }

    let metadata: any = null;
    try {
      metadata = await getBrandQuickMetadata(brandName);
    } catch (e) {
      console.warn('[Brand Analysis] Metadata fetch failed', e);
    }

    const analysis = await withAIUsageLimit(
      user.id,
      user.plan ?? 'free',
      'brand_analyze',
      () => generateBrandAnalysis(brandName, metadata || context),
      { brandKey }
    );

    let visualIdentity: { colorPalette: { primary?: string; secondary?: string; accent?: string }; typography: { heading?: string; body?: string } } | undefined;
    if (isClaudeConfigured()) {
      try {
        visualIdentity = await generateVisualIdentityFromBrand(brandName, analysis);
      } catch (e) {
        console.warn('[Brand Analysis] visualIdentity generation failed', e);
      }
    }

    let logoUrl: string | null = null;
    try {
      logoUrl = await fetchLogoForBrand(brandName);
    } catch (logoErr) {
      console.warn('[Brand Analysis] Logo fetch failed', logoErr);
    }

    try {
      await prisma.brandAnalysis.upsert({
        where: { brandKey },
        create: {
          brandKey,
          brandName,
          analysis,
          visualIdentity: visualIdentity ?? undefined,
          logoUrl: logoUrl ?? undefined,
          signaturePiece: metadata?.signaturePiece,
          dominantStyle: metadata?.dominantStyle,
          cyclePhase: metadata?.cyclePhase,
          launchPotential: metadata?.launchPotential,
          indicativePrice: metadata?.indicativePrice,
          websiteUrl: metadata?.websiteUrl,
        },
        update: {
          analysis,
          visualIdentity: visualIdentity ?? undefined,
          logoUrl: logoUrl ?? undefined,
          signaturePiece: metadata?.signaturePiece,
          dominantStyle: metadata?.dominantStyle,
          cyclePhase: metadata?.cyclePhase,
          launchPotential: metadata?.launchPotential,
          indicativePrice: metadata?.indicativePrice,
          websiteUrl: metadata?.websiteUrl,
        }
      });
    } catch (dbErr) {
      console.error('[Brand Analysis] Erreur enregistrement en base:', dbErr);
    }

    // Créer TemplateStrategy pour que la marque soit proposée dans les choix de positionnement
    if (isClaudeConfigured()) {
      try {
        const slug = brandNameToSlug(brandName);
        const existing = await prisma.templateStrategy.findUnique({ where: { templateBrandSlug: slug } });
        if (!existing) {
          const strategyText = await generateBrandStrategyTemplate(brandName, analysis);
          await prisma.templateStrategy.create({
            data: {
              templateBrandSlug: slug,
              templateBrandName: brandName,
              strategyText,
              visualIdentity: visualIdentity ?? undefined,
            },
          });
        }
      } catch (templateErr) {
        console.warn('[Brand Analysis] Erreur création TemplateStrategy:', templateErr);
      }
    }

    return NextResponse.json({
      brandName,
      analysis,
      visualIdentity: visualIdentity ?? undefined,
      logoUrl: logoUrl ?? undefined,
      metadata: metadata || context,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur lors de l\'analyse';
    console.error('[Brand Analysis]', e);
    const isQuota = message.includes('limité') || message.includes('Quota') || message.includes('épuisé');
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status: isQuota ? 403 : 500 });
  }
}
