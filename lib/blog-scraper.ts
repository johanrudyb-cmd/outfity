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
                // Focus on the main content area to avoid sidebars or static promo blocks
                const main = document.querySelector('main') || document.querySelector('.posts') || document.body;
                const posts = Array.from(main.querySelectorAll('.post-box, article, .post'));

                const results = [];
                for (const p of posts) {
                    const a = (p.querySelector('a.title') || p.querySelector('h2 a') || p.querySelector('h3 a')) as HTMLAnchorElement;
                    if (a && a.href && a.innerText.trim()) {
                        results.push({
                            title: a.innerText.trim(),
                            link: a.href,
                            source: 'Hypebeast',
                        });
                    }
                }

                // Fallback si structure changée : on cherche les URLs d'articles
                if (results.length === 0) {
                    const links = Array.from(main.querySelectorAll('a'));
                    for (const a of links) {
                        if (a.href && a.href.includes('/20') && a.innerText.trim().length > 20) {
                            results.push({
                                title: a.innerText.trim(),
                                link: a.href,
                                source: 'Hypebeast',
                            });
                        }
                    }
                }

                // Déduplication & limite
                const uniqueUrls = new Set();
                const unique = [];
                for (const item of results) {
                    if (!uniqueUrls.has(item.link)) {
                        uniqueUrls.add(item.link);
                        unique.push(item);
                    }
                }
                return unique.slice(0, 5);
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
                const main = document.querySelector('main') || document.querySelector('.main-content') || document.body;
                const links = Array.from(main.querySelectorAll('a'));

                // Un article d'actu valide a une URL avec /actualite/ et un texte de titre assez long
                const validLinks = links.filter(a =>
                    a.href &&
                    a.href.includes('/actualite/') &&
                    !a.href.includes('/tags/') && // on évite les pages de tags
                    a.innerText.trim().length > 30
                );

                // Déduplication par URL
                const uniqueUrls = new Set();
                const unique = [];
                for (const a of validLinks) {
                    if (!uniqueUrls.has(a.href)) {
                        uniqueUrls.add(a.href);
                        unique.push({
                            title: a.innerText.trim(),
                            link: a.href,
                            source: 'Fashion United',
                        });
                    }
                }

                return unique.slice(0, 5); // On remonte les 5 plus frais
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
