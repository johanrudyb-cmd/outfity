import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { brandId, designId, email, source } = body as {
            brandId: string;
            designId?: string;
            email: string;
            source?: string;
        };

        if (!brandId || !email) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        // Enregistrer le lead
        // Si designId est fourni, on utilise la contrainte unique [designId, email]
        // Si non, on pourrait avoir une contrainte générique ou juste créer (mais ici on veut l'unicité par design)

        await prisma.waitlistLead.upsert({
            where: {
                designId_email: {
                    designId: designId || '', // fallback to empty string if no design
                    email: email.toLowerCase()
                }
            },
            create: {
                brandId,
                designId: designId || null,
                email: email.toLowerCase(),
                source: source || 'waitlist'
            },
            update: {
                source: source || 'waitlist'
            }
        });

        return NextResponse.json({ success: true, message: 'Inscription réussie' });

    } catch (error) {
        console.error('[Waitlist Subscribe Error]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
