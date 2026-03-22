/**
 * POST /api/quotes/send-with-attachment
 * Envoie l'email de demande de devis au fournisseur avec le tech pack PDF en pièce jointe.
 * Nécessite SMTP_* configuré dans .env
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const { createTransport } = await import('nodemailer');
  const transporter = createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  if (typeof transporter?.sendMail !== 'function') {
    throw new Error('Transporter nodemailer invalide');
  }
  return transporter;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { designId, factoryId, brandId, subject, body } = await request.json();

    if (!designId || !factoryId || !brandId || !subject || !body) {
      return NextResponse.json(
        { error: 'designId, factoryId, brandId, subject et body requis' },
        { status: 400 }
      );
    }

    const transporter = await getTransporter();
    if (!transporter) {
      return NextResponse.json(
        { error: 'SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS). Utilisez mailto.' },
        { status: 503 }
      );
    }

    const [design, factory, brand] = await Promise.all([
      prisma.design.findFirst({
        where: { id: designId, brandId },
        include: { brand: true },
      }),
      prisma.factory.findUnique({ where: { id: factoryId } }),
      prisma.brand.findFirst({
        where: { id: brandId, userId: user.id },
      }),
    ]);

    if (!design || !factory?.contactEmail || !brand) {
      return NextResponse.json(
        { error: 'Design, fournisseur ou marque non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le PDF du tech pack (appel interne)
    const origin = new URL(request.url).origin;
    const pdfRes = await fetch(`${origin}/api/designs/${designId}/export-pdf`, {
      headers: { Cookie: request.headers.get('cookie') || '' },
    });

    if (!pdfRes.ok) {
      const errData = await pdfRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || 'Impossible de générer le tech pack' },
        { status: 500 }
      );
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const safeType = design.type.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `tech-pack-${safeType}-${dateStr}.pdf`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user.email,
      to: factory.contactEmail,
      replyTo: user.email,
      subject,
      text: body,
      attachments: [{ filename: fileName, content: pdfBuffer }],
    });

    return NextResponse.json({ success: true, message: 'Email envoyé avec le tech pack en pièce jointe.' });
  } catch (error: unknown) {
    console.error('[quotes/send-with-attachment]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}
