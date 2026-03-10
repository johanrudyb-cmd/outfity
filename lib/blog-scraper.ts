import { generateChat } from './api/chatgpt';
import { prisma } from './prisma';

interface ScrapedArticle {
    title: string;
    link: string;
    source: string;
    pubDate?: string;
}

/**
 * Parse un flux RSS XML et retourne les N premiers items
 */
async function parseRssFeed(url: string, sourceName: string, limit = 5): Promise<ScrapedArticle[]> {
    try {
        console.log(`🌐 [RSS] Lecture du flux ${sourceName} : ${url}`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OutfityBot/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.error(`❌ [RSS] ${sourceName} a retourné HTTP ${res.status}`);
            return [];
        }

        const xml = await res.text();

        // Extraction robuste des <item> par regex (évite de dépendre d'un vrai parser XML)
        const items: ScrapedArticle[] = [];
        const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
        let match;

        while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
            const block = match[1];

            // Titre (decode CDATA)
            const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
            // Lien
            const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/) ||
                block.match(/<link\s+href="([^"]+)"/);
            // Date
            const dateMatch = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);

            const title = titleMatch?.[1]?.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;/g, "'").replace(/&#8211;/g, '–');
            const link = linkMatch?.[1]?.trim();
            const pubDate = dateMatch?.[1]?.trim();

            if (title && link && link.startsWith('http')) {
                items.push({ title, link, source: sourceName, pubDate });
            }
        }

        console.log(`✅ [RSS] ${sourceName} : ${items.length} articles récupérés`);
        return items;
    } catch (e) {
        console.error(`❌ [RSS] Erreur sur ${sourceName}:`, e);
        return [];
    }
}

/**
 * Récupère les derniers articles mode via les flux RSS de Hypebeast + Highsnobiety
 * — Aucun navigateur nécessaire, 100% fetch natif, ordonné chronologiquement
 */
export async function scrapeFashionNewsInput(): Promise<ScrapedArticle[]> {
    console.log('📡 [Blog Scraper] Récupération des flux RSS mode...');

    const [hypebeastArticles, highsnobietyArticles] = await Promise.all([
        parseRssFeed('https://hypebeast.com/feed', 'Hypebeast', 5),
        parseRssFeed('https://www.highsnobiety.com/feed/', 'Highsnobiety', 5),
    ]);

    // On mélange les sources, en alternant pour avoir un mix équilibré
    const merged: ScrapedArticle[] = [];
    const maxLen = Math.max(hypebeastArticles.length, highsnobietyArticles.length);
    for (let i = 0; i < maxLen; i++) {
        if (hypebeastArticles[i]) merged.push(hypebeastArticles[i]);
        if (highsnobietyArticles[i]) merged.push(highsnobietyArticles[i]);
    }

    // Déduplication globale par URL
    const seen = new Set<string>();
    const unique = merged.filter(a => {
        if (seen.has(a.link)) return false;
        seen.add(a.link);
        return true;
    });

    console.log(`✅ [Blog Scraper] ${unique.length} articles uniques trouvés (${hypebeastArticles.length} HB + ${highsnobietyArticles.length} HS)`);
    return unique;
}

/**
 * Lit l'article via fetch natif, utilise GPT pour le réécrire façon OUTFITY et crée le post
 */
export async function processAndCreateBlogPost(article: ScrapedArticle) {
    console.log(`🧠 [Blog Scraper] Réécriture IA de l'article : ${article.title}`);

    // 1. Lecture de l'article avec fetch natif (pas besoin de navigateur)
    let rawContent = article.title;
    let coverImage = 'https://images.unsplash.com/photo-1558769132-cb1fac30bc3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'; // Fallback

    try {
        const res = await fetch(article.link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OutfityBot/1.0)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
            const html = await res.text();

            // Extraire og:description (résumé de l'article)
            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

            // Extraire og:image (image de couverture)
            const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

            // Extraire le texte brut des paragraphes <p> (simple regex)
            const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
                .map(m => m[1].replace(/<[^>]+>/g, '').trim())
                .filter(t => t.length > 40)
                .join('\n\n')
                .substring(0, 3000);

            if (paragraphs.length > 100) rawContent = paragraphs;
            else if (descMatch?.[1]) rawContent = decodeURIComponent(descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'"));

            if (imgMatch?.[1]) coverImage = imgMatch[1];
        }
    } catch (e) {
        console.error(`⚠️ Impossible de récupérer le contenu de ${article.link}, on utilise uniquement le titre.`, e);
    }


    // 2. IA - Réécriture du contenu en Blog Post complet et structuré
    const systemPrompt = `Tu es le Stratège Marketing en Chef de BIANGORY.
CONSIGNES DE STYLE CRUCIALES :
1. TITRE : Utilise uniquement le format "Sentence case" (majuscule uniquement au premier mot du titre). INTERDICTION de mettre des majuscules à chaque mot.
2. STRUCTURE : Rédige un récit fluide. Ne mets AUCUN sous-titre (pas de H2, pas de H3, pas de gras pour les titres).
3. PARAGRAPHES : Espace généreusement tes paragraphes pour assurer une lecture aérée et premium.
4. TON : Reste expert, analytique et visionnaire. 
TA MISSION : Transformer cette news en une analyse marketing profonde (600-800 mots) qui servira de base de données stratégique pour notre IA. IL EST VITAL DE FAIRE AU MOINS 600 MOTS, DEVELOPPE CHAQUE POINT EN PROFONDEUR.

TON ANGLE D'ATTAQUE (MARKETING CORE) :
Pour chaque article, tu dois impérativement analyser ces 3 points de manière très approfondie :
1. LE POSITIONNEMENT : Où se situe la marque ? Qui est la cible précise (Persona) ? Quelle est la proposition de valeur ?
2. L'AVANTAGE CONCURRENTIEL : Pourquoi ce mouvement est-il malin par rapport aux concurrents ? Parle de parts de marché et de branding.
3. LA DATA-STRATÉGIE : Explique pourquoi la maîtrise de la donnée est la clé du succès de ce projet.

TON STYLE D'ÉCRITURE :
- STYLE : Éditorial de haut vol, type "Harvard Business Review" version Streetwear/Créateur de Média.
- FLUIDITÉ : AUCUN Titre (##), AUCUNE liste. Écris un texte continu et extrêmement dense.
- TRADUCTION : Tout en Français pur, même si la source est en anglais.

FAIRE LE PONT VERS L'APP OUTFITY :
Termine l'article en expliquant que pour anticiper ces mouvements de marché, les entrepreneurs doivent utiliser la puissance de la data d'OUTFITY. Fais-en la suite logique de l'analyse.

FORMAT DE SORTIE (JSON STRICT) :
{
  "title": "Titre Stratégique & Marketing (en Français)",
  "slug": "titre-seo-marketing",
  "excerpt": "Le point clé stratégique de cet article en une phrase.",
  "content": "Ton analyse marketing longue et détaillée de 600-800 mots... récit fluide... finissant par la recommandation OUTFITY.",
  "tags": ["Marketing", "Stratégie", "Business", "Data"],
  "coverImage": "URL IMAGE",
  "sourceUrl": "URL SOURCE"
}`;

    const promptText = `Analyse cette news venant de ${article.source} pour notre blog:
Titre original: ${article.title}
Contenu brut:
${rawContent}

RAPPEL: La longueur est vitale pour ce format HBR. Développe ton analyse, utilise des paragraphes longs et denses.
N'oublie pas de répondre STRICTEMENT au format JSON attendu, sans fioritures autour. Couverture demandée: ${coverImage}`;

    let gptResultJson = "{}";
    try {
        const responseText = await generateChat(systemPrompt, [{ role: 'user', content: promptText }], { model: 'gpt-4o', temperature: 0.7, maxTokens: 2500 });
        const cleanJsonStr = responseText.replace(/^```json/g, '').replace(/```$/g, '').trim();
        gptResultJson = JSON.parse(cleanJsonStr);
    } catch (e) {
        console.error('❌ Erreur lors de la génération IA:', e);
        return null;
    }

    const output = gptResultJson as any;
    if (!output.title || !output.content) return null;

    // 3. Sauvegarder dans la DB
    const slug = output.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
        const post = await prisma.blogPost.upsert({
            where: { slug },
            update: {}, // Si ça existe on ignore (ou on maj)
            create: {
                title: output.title,
                slug,
                excerpt: output.excerpt || output.title,
                content: output.content,
                coverImage,
                author: 'VIRGIL',
                published: true, // Publié directement, ou false si on veut valider à la main
                publishedAt: new Date(),
                tags: output.tags || ['news'],
                sourceUrl: article.link
            }
        });
        console.log(`✅ [Blog Scraper] Article sauvegardé en DB: ${post.title}`);
        return post;
    } catch (e) {
        console.error('❌ Erreur lors de l\'enregistrement en DB:', e);
        return null;
    }
}
