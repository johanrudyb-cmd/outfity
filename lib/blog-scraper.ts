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

        // 2. Scrape Fashion United
        console.log('🌐 [Blog Scraper] Scraping Fashion United...');
        try {
            await page.goto('https://fashionunited.fr/actualite', { waitUntil: 'domcontentloaded', timeout: 30000 });

            const fuArticles = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const validLinks = links.filter(a => a.href && a.href.includes('/actualite/') && a.innerText.trim().length > 30);

                // Déduplication locale par URL
                const unique = Array.from(new Map(validLinks.map(a => [a.href, a])).values());

                return unique.slice(0, 3).map(a => ({
                    title: a.innerText.trim(),
                    link: a.href,
                    source: 'Fashion United',
                }));
            });

            articles.push(...fuArticles);
        } catch (e) {
            console.error('❌ Erreur Fashion United Scrape:', e);
        }

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
    const systemPrompt = `Tu es le Stratège Marketing en Chef de BIANGORY (la plateforme OUTFITY).
CONSIGNES DE STYLE CRUCIALES :
1. TITRE : Utilise uniquement le format "Sentence case" (majuscule uniquement au premier mot du titre). INTERDICTION de mettre des majuscules à chaque mot.
2. STRUCTURE : Rédige un récit fluide. Ne mets AUCUN sous-titre (pas de H2, pas de H3, pas de gras pour les titres).
3. PARAGRAPHES : Espace généreusement tes paragraphes pour assurer une lecture aérée et premium.
4. TON : Reste expert, analytique et visionnaire. 
TA MISSION : Transformer cette news en une analyse marketing profonde (600-800 mots).

TON ANGLE D'ATTAQUE (MARKETING CORE) :
Pour chaque article, tu dois impérativement analyser ces 3 points :
1. LE POSITIONNEMENT : Où se situe la marque ? Qui est la cible précise (Persona) ? Quelle est la proposition de valeur ?
2. L'AVANTAGE CONCURRENTIEL : Pourquoi ce mouvement est-il malin par rapport aux concurrents ? Parle de parts de marché et de branding.
3. LA DATA-STRATÉGIE : Explique pourquoi la maîtrise de la donnée est la clé du succès de ce projet.

TON STYLE D'ÉCRITURE :
- STYLE : Éditorial de haut vol, type "Harvard Business Review" version mode/streetwear.
- FLUIDITÉ : AUCUN Titre (##), AUCUNE liste. Écris un texte continu et dense.
- TRADUCTION : Tout en Français pur, même si la source est en anglais.

FAIRE LE PONT VERS L'APP OUTFITY :
Termine l'article en expliquant que pour anticiper ces mouvements de marché, les entrepreneurs doivent utiliser la puissance de la data d'OUTFITY. Fais-en la suite logique de l'analyse.

FORMAT DE SORTIE STRICT (JSON) :
{
  "title": "Titre Stratégique & Marketing (en Français, Sentence case)",
  "excerpt": "Le point clé stratégique de cet article en une phrase.",
  "content": "Ton analyse marketing de 600-800 mots... fluide... finissant par la recommandation OUTFITY.",
  "tags": ["Marketing", "Stratégie", "Business", "Data"]
}`;

    const promptText = `Analyse cette news venant de ${article.source} pour notre blog:
Titre original: ${article.title}
Contenu brut:
${rawContent}

N'oublie pas de répondre STRICTEMENT au format JSON attendu, sans fioritures autour.`;

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
