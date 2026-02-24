import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfity.fr';

    const routes = [
        '',
        '/about',
        '/brands',
        '/blog',
        '/communaute',
        '/contact',
        '/content-creation',
        '/docs',
        '/support',
        '/trends',
        '/legal/mentions',
        '/legal/privacy',
        '/legal/sales',
        '/legal/terms',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));
}
