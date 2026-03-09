import { getBrowser } from './api/browser';
import { generateChat } from './api/chatgpt';
import { prisma } from './prisma';

interface ScrapedArticle {
    title: string;
    link: string;
    source: string;
}

/**
 * Scrape les derniers articles de presse urbaine/mode (ex: Hypebeast, BoF)
 */
export async function scrapeFashionNewsInput(): Promise<ScrapedArticle[]> {
    console.log('🌐 [Blog Scraper] Lancement de Browserless pour scraper les news...');
    const browser = await getBrowser();
    const articles: ScrapedArticle[] = [];

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 1. Scrape Hypebeast Fashion
        console.log('🌐 [Blog Scraper] Scraping Hypebeast...');
        try {
            await page.goto('https://hypebeast.com/fashion', { waitUntil: 'domcontentloaded', timeout: 30000 });

            const hbArticles = await page.evaluate(() => {
                const posts = Array.from(document.querySelectorAll('.post-box'));
                return posts.slice(0, 3).map(p => {
                    const a = p.querySelector('a.title') as HTMLAnchorElement;
                    return {
                        title: a?.innerText?.trim() || '',
                        link: a?.href || '',
                        source: 'Hypebeast',
                    };
                }).filter(a => a.title && a.link);
            });

            articles.push(...hbArticles);
        } catch (e) {
            console.error('❌ Erreur Hypebeast Scrape:', e);
        }

        // On peut rajouter d'autres sites ici plus tard (Highsnobiety, Vogue Business...)

    } finally {
        await browser.close();
    }

    console.log(`✅ [Blog Scraper] ${articles.length} articles trouvés.`);
    return articles;
}

/**
 * Lit l'article, utilise GPT pour le réécrire façon OUTFITY et crée le post
 */
export async function processAndCreateBlogPost(article: ScrapedArticle) {
    console.log(`🧠 [Blog Scraper] Réécriture IA de l'article : ${article.title}`);

    // 1. Visiter l'article pour récupérer le texte brut (Optionnel mais recommandé pour un meilleur résumé)
    const browser = await getBrowser();
    let rawContent = article.title;
    let coverImage = 'https://images.unsplash.com/photo-1558769132-cb1fac30bc3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'; // Fallback

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(article.link, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Scraping basique du corps de texte (très générique)
        const scraped = await page.evaluate(() => {
            const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.innerText).join('\n\n');
            const img = document.querySelector('meta[property="og:image"]');
            return {
                text: paragraphs.substring(0, 3000), // On limite à 3000 char pour le LLM
                image: img ? img.getAttribute('content') : null
            };
        });

        if (scraped.text.length > 100) rawContent = scraped.text;
        if (scraped.image) coverImage = scraped.image;
    } catch (e) {
        console.error(`⚠️ Impossible de scraper le contenu complet de ${article.link}, on utilise que le titre.`, e);
    } finally {
        await browser.close();
    }

    // 2. IA - Réécriture du contenu en Blog Post complet et structuré
    const systemPrompt = `Tu es le Rédacteur en Chef d'OUTFITY, la plateforme de création streetwear.
Ton but est de réécrire cette actualité mode en un article de blog complet, punchy, expert et en français.
Format:
Tu dois impérativement renvoyer un JSON valide avec :
{
  "title": "Un titre accrocheur, max 60 char",
  "excerpt": "Une phrase d'accroche punchy, max 160 char",
  "content": "L'article formaté en Markdown. Utilise des H2, des listes, et du gras.",
  "tags": ["streetwear", "business", ...]
}`;

    const promptText = `Réédite cette news venant de ${article.source} pour notre blog:
Titre original: ${article.title}
Contenu sourcé:
${rawContent}

N'hésite pas à rajouter ton avis d'expert business/mode à la fin de l'article ("L'avis OUTFITY").`;

    let gptResultJson = "{}";
    try {
        const responseText = await generateChat(systemPrompt, [{ role: 'user', content: promptText }], { model: 'gpt-4o-mini', temperature: 0.7 });
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
                author: 'OUTFITY Intelligence',
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
