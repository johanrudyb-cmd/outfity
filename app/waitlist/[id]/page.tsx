import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { WaitlistClient } from './WaitlistClient';

export default async function WaitlistPage({ params, searchParams }: any) {
    const { id } = await params;
    const { design: designId } = await searchParams;

    // Tentative de trouver la marque par ID ou par nom (slug)
    let brand = await prisma.brand.findUnique({
        where: { id },
        include: {
            launchMap: true,
            designs: {
                where: { productImageUrl: { not: null } }
            }
        }
    });

    if (!brand) {
        // Fallback sur le nom si l'ID ne correspond pas (pour les jolis liens)
        const possibleName = id.replace(/-/g, ' ');
        brand = await prisma.brand.findFirst({
            where: { name: { equals: possibleName, mode: 'insensitive' } },
            include: {
                launchMap: true,
                designs: {
                    where: { productImageUrl: { not: null } }
                }
            }
        });
    }

    if (!brand || !brand.launchMap) {
        return notFound();
    }

    const settings = ((brand.launchMap as any).waitlistSettings as any) || {};

    // Déterminer le design à afficher
    const targetDesignId = designId || settings.designId;
    const selectedDesign = brand.designs.find(d => d.id === targetDesignId) || brand.designs[0];

    return (
        <WaitlistClient
            brand={brand}
            settings={settings}
            selectedDesign={selectedDesign}
        />
    );
}
