import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { uploadToSupabaseStorage, isSupabaseStorageConfigured } from '@/lib/supabase-storage';

export const runtime = 'nodejs';

/** Taille requise pour le logo (carré, adapté partout). */
export const LOGO_WIDTH = 256;
export const LOGO_HEIGHT = 256;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;
    const isLogo = formData.get('isLogo') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pour le logo : vérifier les dimensions (256x256)
    if (isLogo) {
      const meta = await sharp(buffer).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (w !== LOGO_WIDTH || h !== LOGO_HEIGHT) {
        return NextResponse.json(
          { error: `Le logo doit faire exactement ${LOGO_WIDTH}×${LOGO_HEIGHT} pixels. Votre image fait ${w}×${h} px. Redimensionnez-la puis réessayez.` },
          { status: 400 }
        );
      }
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${safeFilename}`;

    // ---- STRATÉGIE D'UPLOAD ----
    // 1. Priorité : Supabase Storage (URL publique permanente, accessible par APIs tierces)
    // 2. Fallback : système de fichiers local (uniquement en développement)

    if (isSupabaseStorageConfigured()) {
      try {
        const folder = brandId ? `brands/${brandId}` : 'misc';
        const publicUrl = await uploadToSupabaseStorage(buffer, filename, file.type, folder);
        return NextResponse.json({ url: publicUrl, filename });
      } catch (storageError: any) {
        console.error('[Upload] Supabase Storage failed, falling back to local:', storageError?.message);
        // Fall through to local storage
      }
    }

    // Fallback : stockage local (développement uniquement — non persistant sur Vercel)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', brandId || 'misc');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // AVERTISSEMENT : cette URL ne fonctionnera pas avec les APIs tierces en local
    const url = `/uploads/${brandId || 'misc'}/${filename}`;
    console.warn('[Upload] ⚠️ Fichier sauvegardé localement. Configurez SUPABASE_SERVICE_ROLE_KEY pour un stockage persistant.');

    return NextResponse.json({ url, filename });
  } catch (error: any) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'upload' },
      { status: 500 }
    );
  }
}
