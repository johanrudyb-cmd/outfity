import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfity.fr';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/api/',
                '/dashboard/',
                '/settings/',
                '/notifications/',
                '/usage/',
                '/auth/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
