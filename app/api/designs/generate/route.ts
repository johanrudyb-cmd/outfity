import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { isFreePlan } from '@/lib/plan-utils';
import { rateLimitByUser } from '@/lib/rate-limit';
import { enhancePrompt, generateTechPack } from '@/lib/api/chatgpt';
import { generateFlatSketch } from '@/lib/api/ideogram';
import { NotificationHelpers } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { brandId, type, cut, material, details, customPrompt, autoApplyIdentity } = await request.json();

    // Vérifier que la marque appartient à l'utilisateur
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });
    }

    // Rate limiting : 5 requêtes par minute par utilisateur
    const rateLimitResult = await rateLimitByUser(user.id, 'designs:generate', {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    // Vérifier les limites selon le plan (Free: 3, Pro: illimité)
    const designCount = await prisma.design.count({
      where: { brandId },
    });

    if (isFreePlan(user.plan) && designCount >= 3) {
      return NextResponse.json(
        { error: 'Limite atteinte. Passez au plan Pro pour générer plus de designs.' },
        { status: 403 }
      );
    }

    // Créer le design en attente
    const design = await prisma.design.create({
      data: {
        brandId,
        type,
        cut,
        material,
        status: 'processing',
      },
    });

    try {
      // Construire le prompt de base
      let basePrompt = `${type}, ${cut} cut, ${material}`;

      // Ajouter l'identité de marque si activée
      if (autoApplyIdentity && brand.logo && brand.colorPalette) {
        const colorInfo = typeof brand.colorPalette === 'object'
          ? Object.entries(brand.colorPalette).map(([key, value]) => `${key}: ${value}`).join(', ')
          : '';
        basePrompt += `, marque ${brand.name}, logo ${brand.logo}, couleurs ${colorInfo}`;
      }

      const detailsList = Object.entries(details)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(', ');

      const fullPrompt = customPrompt
        ? `${basePrompt}, ${detailsList ? detailsList + ', ' : ''}${customPrompt}`
        : `${basePrompt}${detailsList ? ', ' + detailsList : ''}`;

      // Vérifier que OpenAI est configuré
      const openaiApiKey = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        await prisma.design.update({
          where: { id: design.id },
          data: { status: 'failed' },
        });
        return NextResponse.json(
          {
            error: 'Clé API OpenAI non configurée. Veuillez configurer OPENAI_API_KEY ou CHATGPT_API_KEY dans les variables d\'environnement.',
            designId: design.id
          },
          { status: 503 }
        );
      }

      // Améliorer le prompt avec ChatGPT
      const enhancedPrompt = await enhancePrompt(fullPrompt, {
        type,
        style: 'professional',
      });

      // Vérifier que Ideogram est configuré (pour flat sketch)
      const ideogramApiKey = process.env.IDEogram_API_KEY;
      if (!ideogramApiKey) {
        await prisma.design.update({
          where: { id: design.id },
          data: { status: 'failed' },
        });
        return NextResponse.json(
          {
            error: 'Clé API Ideogram non configurée. Veuillez configurer IDEogram_API_KEY dans les variables d\'environnement.',
            designId: design.id
          },
          { status: 503 }
        );
      }

      // Générer le flat sketch avec Ideogram
      const flatSketchUrl = await generateFlatSketch(enhancedPrompt);

      // Générer le tech pack avec ChatGPT
      const techPack = await generateTechPack({
        type,
        cut,
        details,
        material,
      });

      // Mettre à jour le design
      const updatedDesign = await prisma.design.update({
        where: { id: design.id },
        data: {
          flatSketchUrl,
          techPack,
          prompt: enhancedPrompt,
          status: 'completed',
        },
      });

      // Créer une notification
      await NotificationHelpers.designCompleted(user.id, type, updatedDesign.id);

      // Vérifier si c'est le premier design pour valider Phase 2
      const designCount = await prisma.design.count({
        where: { brandId, status: 'completed' },
      });

      if (designCount === 1) {
        // Marquer la Phase 3 (Design) comme complétée
        await prisma.launchMap.updateMany({
          where: { brandId },
          data: { phase3: true },
        });
        // Notification pour phase complétée
        await NotificationHelpers.phaseCompleted(user.id, 3, 'Création du premier design');
      }

      return NextResponse.json({ design: updatedDesign });
    } catch (error: any) {
      // Marquer le design comme échoué
      await prisma.design.update({
        where: { id: design.id },
        data: { status: 'failed' },
      });

      console.error('Erreur lors de la génération:', error);
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la génération du design' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur dans /api/designs/generate:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
