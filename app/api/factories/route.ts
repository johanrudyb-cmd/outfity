import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
// Les usines ne changent quasiment jamais — cache 30 min
export const revalidate = 1800;

export async function GET() {
  try {
    // Vérifier si des usines existent, sinon créer des données de test
    const count = await prisma.factory.count();

    if (count === 0) {
      const defaultFactories = [
        { name: 'ASBX', country: 'Portugal', moq: 50, specialties: ['Knitwear', 'Streetwear', 'Luxury Jersey', 'Sustainable', 'Custom Manufacturing'], leadTime: 30, certifications: ['OEKO-TEX', 'GOTS'], contactEmail: 'hello@asbx.pt', contactPhone: null, website: 'https://asbx.pt', rating: 4.8 },
        { name: 'Tetriberica', country: 'Portugal', moq: 100, specialties: ['Luxury Knits', 'Eco-fashion', 'Knitting textiles', 'Dyeing', 'Printing', 'Embroidery'], leadTime: 84, certifications: ['OEKO-TEX', 'GOTS'], contactEmail: 'info@tetriberica.pt', contactPhone: null, website: 'https://tetriberica.pt', rating: 4.7 },
        { name: 'Create Fashion Brand', country: 'Portugal', moq: 50, specialties: ['Premium Streetwear', 'Heavyweight Cotton', 'Jackets', 'Denim', 'Chinos', 'Sports wear', 'Organic Cotton'], leadTime: 70, certifications: ['OEKO-TEX', 'GOTS', 'OCS', 'Global Recycled Standard'], contactEmail: 'hello@createfashionbrand.com', contactPhone: null, website: 'https://createfashionbrand.com', rating: 4.9 },
        { name: 'Chantuque', country: 'Turkey', moq: 100, specialties: ['High-end contemporary apparel', 'Istanbul'], leadTime: 45, certifications: ['OEKO-TEX'], contactEmail: 'info@chantuque.com', contactPhone: null, website: 'https://chantuque.com', rating: 4.5 },
        { name: 'Kardem', country: 'Turkey', moq: 500, specialties: ['Ready-made garments', 'Mass production', 'Global Retail', 'Turkey & Serbia'], leadTime: 45, certifications: ['OEKO-TEX'], contactEmail: 'info@kardem.com', contactPhone: null, website: 'https://kardem.com', rating: 4.3 },
        { name: 'Hermin', country: 'Turkey', moq: 200, specialties: ['Textiles', 'Shirting', 'Woven garments'], leadTime: 40, certifications: ['OEKO-TEX'], contactEmail: 'info@hermin.com.tr', contactPhone: null, website: 'https://hermin.com.tr', rating: 4.4 },
        { name: 'MPY Textile', country: 'Turkey', moq: 150, specialties: ['Fashion collection development'], leadTime: 38, certifications: ['OEKO-TEX'], contactEmail: 'info@mpytextile.com', contactPhone: null, website: 'https://mpytextile.com', rating: 4.6 },
        { name: 'Confetil', country: 'Portugal', moq: 100, specialties: ['Activewear', 'High-tech jerseys'], leadTime: 32, certifications: ['OEKO-TEX'], contactEmail: 'info@confetil.pt', contactPhone: null, website: 'https://confetil.pt', rating: 4.6 },
        { name: 'Sportinout', country: 'Portugal', moq: 100, specialties: ['Technical Sportswear', 'Performance fabrics'], leadTime: 35, certifications: ['OEKO-TEX'], contactEmail: 'info@sportinout.com', contactPhone: null, website: 'https://sportinout.com', rating: 4.5 },
        { name: 'Quanzhou Haixin Garment Technology Co., Ltd', country: 'China', moq: 500, specialties: ['Garments', 'Apparel', 'Clothing technology', 'Quanzhou'], leadTime: 50, certifications: ['OEKO-TEX'], contactEmail: null, contactPhone: null, website: null, rating: 4.4 },
        { name: 'QZHIC', country: 'China', moq: 500, specialties: ['Garments', 'Apparel', 'Alibaba', 'Quanzhou'], leadTime: 50, certifications: ['OEKO-TEX'], contactEmail: null, contactPhone: null, website: 'https://qzhic.en.alibaba.com/fr_FR/company_profile.html', rating: 4.4 },
      ];
      await prisma.factory.createMany({ data: defaultFactories });
    }

    const factories = await prisma.factory.findMany({
      orderBy: { rating: 'desc' },
      select: {
        id: true, name: true, country: true, moq: true,
        specialties: true, leadTime: true, certifications: true,
        contactEmail: true, website: true, rating: true,
      },
    });

    const response = NextResponse.json({ factories });
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    return response;
  } catch (error: any) {
    console.error('Erreur dans /api/factories:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
