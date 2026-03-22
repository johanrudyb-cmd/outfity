import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { uploadToSupabaseStorage, isSupabaseStorageConfigured } from '@/lib/supabase-storage';

export const runtime = 'nodejs';

/** Required logo dimensions (square). */
const LOGO_WIDTH = 256;
const LOGO_HEIGHT = 256;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;
    const isLogo = formData.get('isLogo') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit etre une image' }, { status: 400 });
    }

    // Validate max size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier ne doit pas depasser 10MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For logos, require exact 256x256 dimensions
    if (isLogo) {
      const meta = await sharp(buffer).metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (w !== LOGO_WIDTH || h !== LOGO_HEIGHT) {
        return NextResponse.json(
          {
            error: `Le logo doit faire exactement ${LOGO_WIDTH}x${LOGO_HEIGHT} pixels. Votre image fait ${w}x${h} px. Redimensionnez-la puis reessayez.`,
          },
          { status: 400 }
        );
      }
    }

    // Generate unique file name
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${safeFilename}`;

    // Upload strategy:
    // 1) Supabase storage first (public URL)
    // 2) Local filesystem fallback (dev only)
    if (isSupabaseStorageConfigured()) {
      try {
        const folder = brandId ? `brands/${brandId}` : 'misc';
        const publicUrl = await uploadToSupabaseStorage(buffer, filename, file.type, folder);
        return NextResponse.json({ url: publicUrl, filename });
      } catch (storageError: any) {
        console.error('[Upload] Supabase Storage failed, falling back to local:', storageError?.message);
      }
    }

    // Local fallback (not persistent on Vercel)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', brandId || 'misc');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${brandId || 'misc'}/${filename}`;
    console.warn('[Upload] File saved locally. Configure SUPABASE_SERVICE_ROLE_KEY for persistent storage.');

    return NextResponse.json({ url, filename });
  } catch (error: any) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'upload" }, { status: 500 });
  }
}
