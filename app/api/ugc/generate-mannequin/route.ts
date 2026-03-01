import { NextResponse } from 'next/server';
import { sanitizeErrorMessage } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateProductImage, isHiggsfieldConfigured } from '@/lib/api/higgsfield';
import { withAIUsageLimit } from '@/lib/ai-usage';
import { buildMannequinPrompt } from '@/lib/mannequin-questionnaire-types';
import type { MannequinQuestionnaireAnswers } from '@/lib/mannequin-questionnaire-types';
import { uploadUrlToSupabaseStorage, isSupabaseStorageConfigured } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** POST : génère une image de mannequin (cible) à partir du questionnaire ou d'une photo de référence */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const brandId = typeof body.brandId === 'string' ? body.brandId : null;
    const questionnaire = body.questionnaire as MannequinQuestionnaireAnswers | undefined;
    const referencePhotoUrl = typeof body.referencePhotoUrl === 'string' ? body.referencePhotoUrl.trim() : null;

    if (!brandId) {
      return NextResponse.json({ error: 'brandId requis' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

    // Méthode "photo de référence" : on utilise directement l'URL comme image du mannequin
    if (referencePhotoUrl) {
      return NextResponse.json({ imageUrl: referencePhotoUrl, prompt: null });
    }

    if (!questionnaire || typeof questionnaire !== 'object') {
      return NextResponse.json(
        { error: 'questionnaire requis (ou referencePhotoUrl pour une photo de référence)' },
        { status: 400 }
      );
    }

    if (!isHiggsfieldConfigured()) {
      return NextResponse.json(
        { error: 'Génération IA non configurée. Configurez la clé API pour générer le mannequin.' },
        { status: 503 }
      );
    }

    const prompt = buildMannequinPrompt(questionnaire);
    const imageUrl = await withAIUsageLimit(
      user.id,
      user.plan ?? 'free',
      'ugc_generate_mannequin',
      () => generateProductImage(prompt, { aspect_ratio: '3:4' }),
      { brandId }
    );

    // Ré-héberger l'image dans Supabase Storage pour une URL permanente
    let finalImageUrl = imageUrl;
    if (isSupabaseStorageConfigured()) {
      try {
        const filename = `mannequin-${Date.now()}.jpg`;
        finalImageUrl = await uploadUrlToSupabaseStorage(imageUrl, filename, `brands/${brandId}/mannequins`);
      } catch (e) {
        console.warn('[GenerateMannequin] Supabase Storage re-host failed, using original URL:', e);
      }
    }

    return NextResponse.json({ imageUrl: finalImageUrl, prompt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération';
    const isQuota = typeof message === 'string' && (message.includes('limité') || message.includes('Quota') || message.includes('épuisé'));
    console.error('POST /api/ugc/generate-mannequin', error);
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status: isQuota ? 403 : 500 });
  }
}
