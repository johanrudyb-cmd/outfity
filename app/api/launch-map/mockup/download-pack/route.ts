import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import { getMockupCategories, getMockupFilesForCategories } from '@/lib/mockup-pack-catalog';
import path from 'path';
import { Writable } from 'stream';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const typesParam = searchParams.get('types'); // comma-separated: "T-shirt,Sweat,Jeans"

    if (!brandId) {
      return NextResponse.json({ error: 'brandId requis' }, { status: 400 });
    }

    if (user.plan === 'free' || user.plan === 'starter') {
      return NextResponse.json({ error: 'Plan insuffisant (upgrade requis)' }, { status: 403 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });
    }

    const availableCategories = getMockupCategories();
    const categoryIds = availableCategories.map((c) => c.id);

    let selectedTypes: string[] = [];
    if (typesParam && typesParam.trim()) {
      selectedTypes = typesParam
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t && categoryIds.includes(t));
    }

    if (selectedTypes.length === 0) {
      return NextResponse.json(
        { error: 'Sélectionnez au moins un type de mockup. Types disponibles: ' + categoryIds.join(', ') },
        { status: 400 }
      );
    }

    const filesToZip = getMockupFilesForCategories(selectedTypes);

    if (filesToZip.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier à télécharger pour les types sélectionnés' }, { status: 404 });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    const collector = new Writable({
      write(chunk: Buffer, _enc, cb) {
        chunks.push(chunk);
        cb();
      },
    });

    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      collector.on('finish', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
      archive.pipe(collector);

      for (const { category, filePath } of filesToZip) {
        const fileName = path.basename(filePath);
        archive.file(filePath, { name: `${category}/${fileName}` });
      }

      archive.finalize();
    });

    const safeName = brand.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="pack-mockup-${safeName}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[launch-map/mockup/download-pack]', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du téléchargement du pack' },
      { status: 500 }
    );
  }
}
