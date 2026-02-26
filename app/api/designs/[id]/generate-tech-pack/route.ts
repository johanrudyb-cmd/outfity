/**
 * Génère un tech pack ultra détaillé à partir du design (et mockupSpec) et le sauvegarde.
 * POST /api/designs/[id]/generate-tech-pack
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sanitizeErrorMessage } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { generateTechPackVisual, isChatGptConfigured } from '@/lib/api/chatgpt';
import { sendWebPushNotification } from '@/lib/web-push';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!isChatGptConfigured()) {
      return NextResponse.json(
        { error: 'Génération tech pack non configurée.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const design = await prisma.design.findFirst({
      where: {
        id,
        brand: { userId: user.id },
      },
      include: { brand: true },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design non trouvé' }, { status: 404 });
    }

    const visual = await generateTechPackVisual({
      type: design.type,
      cut: design.cut || '',
      material: design.material || '',
      mockupSpec: (design.mockupSpec as Record<string, unknown>) || null,
    });

    const techPack = {
      ...(design.techPack as object || {}),
      ...visual,
      productImageUrl: design.productImageUrl || design.flatSketchUrl,
    };

    await prisma.design.update({
      where: { id },
      data: { techPack },
    });

    try {
      await sendWebPushNotification(user.id, {
        title: "🎨 Ton Tech Pack est prêt !",
        body: "Pharrell a terminé de générer tes documents d'usine. Va voir ça !",
        url: "/design-studio"
      });
    } catch (e) {
      console.error('Erreur notification push tech pack:', e);
    }

    return NextResponse.json({ techPack });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du tech pack';
    console.error('[designs/generate-tech-pack]', error);
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status: 500 });
  }
}
