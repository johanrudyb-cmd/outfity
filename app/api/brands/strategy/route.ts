/**
 * Génération de stratégie personnalisée "Dupliquer pour ma marque".
 * POST /api/brands/strategy
 * Body: { templateBrandName, creatorBrandName, analysisText?, budget?, positioning?, targetAudience?, creatorBrandContext?, creatorStory? }
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sanitizeErrorMessage } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { generateBrandStrategyForCreator, isClaudeConfigured } from '@/lib/api/claude';
import { withAIUsageLimit } from '@/lib/ai-usage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY requise pour générer la stratégie.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const templateBrandName = (body.templateBrandName || body.templateBrand || '').trim();
    const creatorBrandName = (body.creatorBrandName || body.creatorBrand || '').trim();
    const analysisText = typeof body.analysisText === 'string' ? body.analysisText : undefined;
    const budget = typeof body.budget === 'string' ? body.budget.trim() || undefined : undefined;
    const positioning = typeof body.positioning === 'string' ? body.positioning.trim() || undefined : undefined;
    const targetAudience = typeof body.targetAudience === 'string' ? body.targetAudience.trim() || undefined : undefined;
    const creatorBrandContext = typeof body.creatorBrandContext === 'string' ? body.creatorBrandContext.trim() || undefined : undefined;
    const creatorStory = typeof body.creatorStory === 'string' ? body.creatorStory.trim() || undefined : undefined;

    if (!templateBrandName || templateBrandName.length < 2) {
      return NextResponse.json(
        { error: 'Nom de la marque template (inspiration) requis' },
        { status: 400 }
      );
    }
    if (!creatorBrandName || creatorBrandName.length < 2) {
      return NextResponse.json(
        { error: 'Nom de votre marque requis' },
        { status: 400 }
      );
    }

    const strategy = await withAIUsageLimit(
      user.id,
      user.plan ?? 'free',
      'brand_strategy',
      () =>
        generateBrandStrategyForCreator({
          templateBrandName,
          creatorBrandName,
          analysisText,
          budget,
          positioning,
          targetAudience,
          creatorBrandContext,
          creatorStory,
        }),
      { templateBrandName, creatorBrandName }
    );

    // Persist to database if brandId is provided
    const brandId = (body.brandId || '').trim();
    if (brandId && strategy) {
      await prisma.launchMap.upsert({
        where: { brandId },
        update: {
          phase1: true,
          phase1Data: {
            strategy,
            templateBrandName,
            positioning,
            targetAudience
          }
        },
        create: {
          brandId,
          phase1: true,
          phase1Data: {
            strategy,
            templateBrandName,
            positioning,
            targetAudience
          }
        }
      });
    }

    return NextResponse.json({
      templateBrandName,
      creatorBrandName,
      strategy,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur lors de la génération de la stratégie';
    console.error('[Brand Strategy]', e);
    const isQuota = message.includes('limité') || message.includes('Quota') || message.includes('épuisé');
    return NextResponse.json(
      { error: sanitizeErrorMessage(message) },
      { status: isQuota ? 403 : 500 }
    );
  }
}
