/**
 * Scraper pour les grandes marques (Zara, ASOS, Zalando, H&M, Uniqlo)
 * 
 * Extrait les produits des sections "New In" et "Best Sellers"
 * pour détecter les tendances émergentes.
 */

import puppeteer, { type Browser } from 'puppeteer-core';

export type BigBrand = 'Zara' | 'ASOS' | 'Zalando' | 'H&M' | 'Uniqlo' | 
  'Mango' | 'Massimo Dutti' | 'COS' | 'Arket' | 'Weekday' |
  'Bershka' | 'Pull&Bear' | 'Stradivarius' | 'Oysho' | 'Lefties';

export interface BigBrandProduct {
  name: string;
  type: string; // "Pantalon", "Hoodie", "T-shirt"
  cut: string | null; // "Loose Fit", "Oversized", "Slim"
  material: string | null; // "Coton", "Denim"
  color: string | null; // "Noir", "Beige"
  price: number;
  currency: string;
  imageUrl: string | null;
  sourceUrl: string;
  brand: BigBrand;
  section: 'new_in' | 'best_sellers';
  country: string; // "FR", "US", "UK", "DE", etc.
  style: string | null; // "Streetwear", "Minimaliste", "Luxe", "Y2K", etc.
}

type BrandConfig = {
  baseUrl: string;
  newInUrl: string;
  bestSellersUrl: string;
  selectors: { products: string; name: string; price: string; image: string };
};

type RawScrapedProduct = {
  name: string;
  price: number;
  imageUrl: string | null;
  productUrl: string;
};

/**
 * Configuration des scrapers par marque (certaines marques BigBrand peuvent être absentes)
 */
const BRAND_CONFIGS: Partial<Record<BigBrand, BrandConfig>> = {
  Zara: {
    baseUrl: 'https://www.zara.com',
    newInUrl: '/fr/fr/categorie/femme/nouveautes-c358009.html',
    bestSellersUrl: '/fr/fr/categorie/femme/c358009.html',
    selectors: {
      products: '.product-item, .product-card',
      name: '.product-name, h3',
      price: '.price, [data-price]',
      image: '.product-image img, img[data-src]',
    },
  },
  ASOS: {
    baseUrl: 'https://www.asos.com',
    newInUrl: '/new-in/ctas/?nlid=nav|header|new+in',
    bestSellersUrl: '/best-sellers/ctas/?nlid=nav|header|best+sellers',
    selectors: {
      products: 'article[data-auto-id="productTile"]',
      name: 'h3[data-auto-id="productTileTitle"]',
      price: 'span[data-auto-id="productTilePrice"]',
      image: 'img[data-auto-id="productTileImage"]',
    },
  },
  Zalando: {
    baseUrl: 'https://www.zalando.fr',
    newInUrl: '/nouveautes/',
    bestSellersUrl: '/best-sellers/',
    selectors: {
      products: '.z-nvg-catalog_articles-article',
      name: '.z-nvg-catalog_articles-article-name',
      price: '.z-nvg-catalog_articles-article-price',
      image: '.z-nvg-catalog_articles-article-image img',
    },
  },
  'H&M': {
    baseUrl: 'https://www2.hm.com',
    newInUrl: '/fr_fr/ladies/shop-by-product/view-all.html?sort=news',
    bestSellersUrl: '/fr_fr/ladies/shop-by-product/view-all.html?sort=popularity',
    selectors: {
      products: '.product-item',
      name: '.product-item-title',
      price: '.product-item-price',
      image: '.product-item-image img',
    },
  },
  Uniqlo: {
    baseUrl: 'https://www.uniqlo.com',
    newInUrl: '/fr/fr/new-arrivals/',
    bestSellersUrl: '/fr/fr/best-sellers/',
    selectors: {
      products: '.product-tile',
      name: '.product-tile-name',
      price: '.product-tile-price',
      image: '.product-tile-image img',
    },
  },
  // Marques moyennes et émergentes pour enrichir les données
  Mango: {
    baseUrl: 'https://shop.mango.com',
    newInUrl: '/fr/femme/nouveautes',
    bestSellersUrl: '/fr/femme/bestsellers',
    selectors: {
      products: '.product-item',
      name: '.product-name',
      price: '.product-price',
      image: '.product-image img',
    },
  },
  'Massimo Dutti': {
    baseUrl: 'https://www.massimodutti.com',
    newInUrl: '/fr/fr/femme/nouveautes',
    bestSellersUrl: '/fr/fr/femme/bestsellers',
    selectors: {
      products: '.product-item',
      name: '.product-name',
      price: '.product-price',
      image: '.product-image img',
    },
  },
  COS: {
    baseUrl: 'https://www.cos.com',
    newInUrl: '/fr/fr_fr/women/new-arrivals',
    bestSellersUrl: '/fr/fr_fr/women/bestsellers',
    selectors: {
      products: '.product-item',
      name: '.product-name',
      price: '.product-price',
      image: '.product-image img',
    },
  },
};

/**
 * Scraper les produits d'une marque depuis une section
 * 
 * Charge la configuration depuis la base de données si disponible,
 * sinon utilise la configuration codée en dur (fallback)
 */
export async function scrapeBrandSection(
  brand: BigBrand,
  section: 'new_in' | 'best_sellers'
): Promise<BigBrandProduct[]> {
  // Essayer de charger depuis la base de données
  let config = BRAND_CONFIGS[brand];
  
  try {
    const { getBrandConfig } = await import('./brand-config-loader');
    const dbConfig = await getBrandConfig(brand);
    if (dbConfig) {
      // Utiliser la config de la base de données
      config = {
        baseUrl: dbConfig.baseUrl,
        newInUrl: dbConfig.newInUrl,
        bestSellersUrl: dbConfig.bestSellersUrl,
        selectors: dbConfig.selectors,
      };
    }
  } catch (error) {
    // Fallback sur la config codée en dur si erreur
    console.warn(`[Big Brands Scraper] Impossible de charger la config depuis la DB pour ${brand}, utilisation du fallback`);
  }
  
  if (!config) {
    throw new Error(`Configuration manquante pour ${brand}`);
  }

  const url = section === 'new_in' ? config.newInUrl : config.bestSellersUrl;
  const fullUrl = `${config.baseUrl}${url}`;

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(fullUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Attendre le chargement initial
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Scroller pour déclencher le lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroller jusqu'en bas
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Attendre que les sélecteurs soient disponibles
    try {
      await page.waitForSelector(config.selectors.products, { timeout: 10000 });
    } catch (error) {
      // Si le sélecteur n'est pas trouvé, continuer quand même
      console.log(`[Big Brands Scraper] Sélecteur "${config.selectors.products}" non trouvé, continuation...`);
    }

    // Debug : Vérifier si la page s'est chargée
    const pageTitle = await page.title();
    console.log(`[Big Brands Scraper] Page chargée : ${pageTitle} (${fullUrl})`);

    // Debug : Compter les éléments trouvés
    const elementCount = await page.evaluate((selector: string) => {
      return document.querySelectorAll(selector).length;
    }, config.selectors.products);
    console.log(`[Big Brands Scraper] Éléments trouvés avec "${config.selectors.products}" : ${elementCount}`);

    // Extraire les produits avec plusieurs stratégies de fallback
    const productsRaw = (await page.evaluate(
      (selectors: { products: string; name: string; price: string; image: string }) => {
        // Stratégie 1 : Sélecteur principal
        let productElements = Array.from(document.querySelectorAll(selectors.products));
        let usedSelector = selectors.products;
        
        // Stratégie 2 : Sélecteurs alternatifs si aucun trouvé
        if (productElements.length === 0) {
          const alternatives = [
            'div[data-testid="product-card"]',
            'article',
            '[data-product-id]',
            '[data-product]',
            '.product-item',
            '.product-card',
            '.product-tile',
            '[class*="product"]',
            '[id*="product"]',
            'li[class*="item"]',
            'div[class*="item"]',
          ];
          
          for (const alt of alternatives) {
            const found = Array.from(document.querySelectorAll(alt));
            if (found.length > 5) { // Au moins 5 éléments pour être valide
              productElements = found;
              usedSelector = alt;
              console.log(`[Page Evaluate] Utilisation du sélecteur alternatif: ${alt} (${found.length} éléments)`);
              break;
            }
          }
        }

        if (productElements.length === 0) {
          console.log(`[Page Evaluate] Aucun produit trouvé avec les sélecteurs testés`);
          return [];
        }

        return productElements
        .slice(0, 50)
        .map((element) => {
          // Nom : Essayer plusieurs stratégies
          let nameEl = element.querySelector(selectors.name);
          if (!nameEl) {
            const nameSelectors = [
              'a[data-testid="product-card__link-overlay"]',
              'a[class*="link-overlay"]',
              'a[class*="product-card"]',
              'img[data-qa-qualifier="media-image"]',
              'img[alt]',
              'h1', 'h2', 'h3', 'h4',
              '[data-name]',
              '[data-product-name]',
              '[class*="name"]',
              '[class*="title"]',
              '[class*="product-name"]',
              'a[href*="/product"]',
              'a[href*="/t/"]',
              'a[href*="/p/"]',
            ];
            for (const sel of nameSelectors) {
              nameEl = element.querySelector(sel);
              if (nameEl && ((nameEl.getAttribute && nameEl.getAttribute('alt')) || nameEl.textContent || '').trim()) break;
            }
          }
          
          // Prix : Essayer plusieurs stratégies
          let priceEl = element.querySelector(selectors.price);
          if (!priceEl) {
            const priceSelectors = [
              '[data-price]',
              '[class*="price"]',
              '[class*="cost"]',
              '[class*="amount"]',
              'span[class*="price"]',
            ];
            for (const sel of priceSelectors) {
              priceEl = element.querySelector(sel);
              if (priceEl && priceEl.textContent?.trim()) break;
            }
          }
          
          // Image : Essayer plusieurs stratégies
          let imageEl = element.querySelector(selectors.image);
          if (!imageEl) {
            imageEl = element.querySelector('img');
          }
          
          // Lien : Essayer plusieurs stratégies
          let linkEl = element.querySelector('a');
          if (!linkEl) {
            linkEl = element.closest('a');
          }
          if (!linkEl && element.tagName === 'A') {
            linkEl = element as HTMLAnchorElement;
          }

          const name = (nameEl ? ((nameEl.getAttribute && nameEl.getAttribute('alt')) || nameEl.textContent || '').trim() : '') || '';
          let priceText = priceEl?.textContent?.trim() || '';
          const imageUrl = (imageEl as HTMLImageElement)?.src || 
                          (imageEl as HTMLImageElement)?.getAttribute('data-src') || 
                          (imageEl as HTMLImageElement)?.getAttribute('data-lazy-src') ||
                          (imageEl as HTMLImageElement)?.getAttribute('srcset')?.split(' ')[0] ||
                          null;
          const productUrl = linkEl?.href || element.getAttribute('href') || '';

          // Grilles type Zara : nom+prix dans li.product-grid-block-dynamic__product-info avec le même lien
          if (!priceText && productUrl) {
            const infoBlocks = Array.from(document.querySelectorAll('li.product-grid-block-dynamic__product-info'));
            const infoBlock = infoBlocks.find((li) => {
              const a = li.querySelector('a.product-grid-product-info__name, a[href]');
              return a && (a as HTMLAnchorElement).href === productUrl;
            });
            if (infoBlock) {
              const priceSpan = infoBlock.querySelector('.money-amount__main');
              priceText = priceSpan?.textContent?.trim() || '';
            }
          }

          // Extraire le prix (supprimer symboles, garder nombres)
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;

          return {
            name,
            price,
            imageUrl,
            productUrl,
          };
        })
        .filter((p: RawScrapedProduct) => {
          // Filtrer : nom valide ET (prix > 0 OU image présente)
          return p.name && p.name.length > 3 && (p.price > 0 || p.imageUrl);
        });
      },
      config.selectors
    )) as RawScrapedProduct[];
    
    console.log(`[Big Brands Scraper] ${productsRaw.length} produits extraits (avant filtrage)`);

    // Traiter les produits en dehors du contexte du navigateur
    const products = productsRaw.map((productRaw: RawScrapedProduct) => {
      // Normaliser le nom pour extraire type, coupe, matériau, couleur
      const normalized = normalizeProductName(productRaw.name);
      
      // Déterminer le pays basé sur l'URL
      const country = extractCountryFromUrl(fullUrl, brand);
      
      // Déterminer le style basé sur le nom du produit
      const style = determineStyleFromName(productRaw.name);

      return {
        name: productRaw.name,
        type: normalized.type,
        cut: normalized.cut,
        material: normalized.material,
        color: normalized.color,
        price: productRaw.price,
        currency: 'EUR',
        imageUrl: productRaw.imageUrl,
        sourceUrl: productRaw.productUrl,
        brand: brand,
        section: section,
        country,
        style,
      };
    });

    await browser.close();
    return products.filter((p: BigBrandProduct) => p.name && p.price > 0);
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[Big Brands Scraper] Erreur pour ${brand} (${section}):`, error);
    return [];
  }
}

/**
 * Normaliser le nom du produit pour extraire type, coupe, matériau, couleur
 */
function normalizeProductName(name: string): {
  type: string;
  cut: string | null;
  material: string | null;
  color: string | null;
} {
  const nameLower = name.toLowerCase();

  // Déterminer le type
  let type = 'T-shirt'; // Par défaut
  if (nameLower.includes('hoodie') || nameLower.includes('sweatshirt')) {
    type = 'Hoodie';
  } else if (nameLower.includes('pantalon') || nameLower.includes('pant') || nameLower.includes('jean')) {
    type = 'Pantalon';
  } else if (nameLower.includes('cargo')) {
    type = 'Cargo';
  } else if (nameLower.includes('t-shirt') || nameLower.includes('tshirt')) {
    type = 'T-shirt';
  } else if (nameLower.includes('veste') || nameLower.includes('jacket') || nameLower.includes('bomber')) {
    type = 'Veste';
  } else if (nameLower.includes('short')) {
    type = 'Short';
  }

  // Extraire la coupe
  let cut: string | null = null;
  if (nameLower.includes('loose') || nameLower.includes('oversized') || nameLower.includes('baggy')) {
    cut = 'Loose Fit';
  } else if (nameLower.includes('slim') || nameLower.includes('fitted')) {
    cut = 'Slim Fit';
  } else if (nameLower.includes('regular') || nameLower.includes('classic')) {
    cut = 'Regular Fit';
  } else if (nameLower.includes('wide') || nameLower.includes('wide-leg')) {
    cut = 'Wide Leg';
  }

  // Extraire le matériau
  let material: string | null = null;
  if (nameLower.includes('coton') || nameLower.includes('cotton')) {
    material = 'Coton';
  } else if (nameLower.includes('denim')) {
    material = 'Denim';
  } else if (nameLower.includes('polyester')) {
    material = 'Polyester';
  } else if (nameLower.includes('lin') || nameLower.includes('linen')) {
    material = 'Lin';
  }

  // Extraire la couleur (basique)
  let color: string | null = null;
  const colors = ['noir', 'black', 'blanc', 'white', 'beige', 'bleu', 'blue', 'rouge', 'red', 'vert', 'green'];
  for (const c of colors) {
    if (nameLower.includes(c)) {
      color = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  return { type, cut, material, color };
}

/**
 * Extraire le pays depuis l'URL ou la marque
 */
function extractCountryFromUrl(url: string, brand: BigBrand): string {
  // Extraire le code pays depuis l'URL
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/fr/') || urlLower.includes('.fr') || urlLower.includes('fr_fr')) {
    return 'FR';
  }
  if (urlLower.includes('/en/') || urlLower.includes('.com') && !urlLower.includes('.fr')) {
    return 'US';
  }
  if (urlLower.includes('/uk/') || urlLower.includes('.co.uk')) {
    return 'UK';
  }
  if (urlLower.includes('/de/') || urlLower.includes('.de')) {
    return 'DE';
  }
  if (urlLower.includes('/es/') || urlLower.includes('.es')) {
    return 'ES';
  }
  if (urlLower.includes('/it/') || urlLower.includes('.it')) {
    return 'IT';
  }
  
  // Par défaut selon la marque (marques sans entrée → FR)
  const brandDefaults: Partial<Record<BigBrand, string>> = {
    'Zara': 'ES', // Zara est espagnol
    'ASOS': 'UK', // ASOS est britannique
    'Zalando': 'DE', // Zalando est allemand
    'H&M': 'SE', // H&M est suédois
    'Uniqlo': 'JP', // Uniqlo est japonais
  };

  return brandDefaults[brand] ?? 'FR';
}

/**
 * Déterminer le style depuis le nom du produit
 */
function determineStyleFromName(name: string): string | null {
  const nameLower = name.toLowerCase();
  
  // Streetwear
  if (nameLower.includes('streetwear') || nameLower.includes('urban') ||
      nameLower.includes('cargo') || nameLower.includes('oversized') ||
      nameLower.includes('baggy') || nameLower.includes('hoodie')) {
    return 'Streetwear';
  }
  
  // Y2K
  if (nameLower.includes('y2k') || nameLower.includes('vintage') ||
      nameLower.includes('retro') || nameLower.includes('90s') ||
      nameLower.includes('2000')) {
    return 'Y2K';
  }
  
  // Luxe
  if (nameLower.includes('luxe') || nameLower.includes('luxury') ||
      nameLower.includes('premium') || nameLower.includes('cashmere') ||
      nameLower.includes('silk') || nameLower.includes('leather')) {
    return 'Luxe';
  }
  
  // Minimaliste
  if (nameLower.includes('minimal') || nameLower.includes('basic') ||
      nameLower.includes('essential') || nameLower.includes('classic') ||
      nameLower.includes('simple')) {
    return 'Minimaliste';
  }
  
  // Sportswear
  if (nameLower.includes('sport') || nameLower.includes('athletic') ||
      nameLower.includes('jogging') || nameLower.includes('training')) {
    return 'Sportswear';
  }
  
  // Casual
  if (nameLower.includes('casual') || nameLower.includes('everyday') ||
      nameLower.includes('comfort')) {
    return 'Casual';
  }
  
  return null; // Style non déterminé
}

/**
 * Scraper toutes les marques (New In + Best Sellers)
 */
export async function scrapeAllBigBrands(includeMediumBrands: boolean = false): Promise<BigBrandProduct[]> {
  // Charger les marques depuis la base de données
  let brands: BigBrand[] = [];
  
  try {
    const { loadBrandConfigs } = await import('./brand-config-loader');
    const configs = await loadBrandConfigs();
    const allBrands = Array.from(configs.keys()) as BigBrand[];
    
    // Filtrer par priorité si nécessaire
    if (includeMediumBrands) {
      brands = allBrands; // Toutes les marques actives
    } else {
      // Seulement les marques haute priorité (1-2)
      brands = allBrands.filter((brand) => {
        const config = configs.get(brand);
        return config && config.priority <= 2;
      });
    }
    
    // Fallback sur les marques hardcodées si aucune dans la DB
    if (brands.length === 0) {
      console.warn('[Big Brands Scraper] Aucune marque dans la DB, utilisation du fallback');
      brands = ['Zara', 'ASOS', 'Zalando', 'H&M', 'Uniqlo'];
    }
  } catch (error) {
    console.warn('[Big Brands Scraper] Erreur lors du chargement depuis la DB, utilisation du fallback:', error);
    brands = ['Zara', 'ASOS', 'Zalando', 'H&M', 'Uniqlo'];
  }
  
  const sections: Array<'new_in' | 'best_sellers'> = ['new_in', 'best_sellers'];
  const allProducts: BigBrandProduct[] = [];

  console.log(`[Big Brands Scraper] Début du scraping de ${brands.length} marques...`);

  for (const brand of brands) {
    for (const section of sections) {
      try {
        console.log(`[Big Brands Scraper] Scraping ${brand} - ${section}...`);
        const products = await scrapeBrandSection(brand, section);
        console.log(`[Big Brands Scraper] ${products.length} produits trouvés pour ${brand} - ${section}`);
        allProducts.push(...products);
        
        // Rate limiting : attendre 3 secondes entre chaque requête
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        console.error(`[Big Brands Scraper] Erreur pour ${brand} - ${section}:`, error.message);
        continue;
      }
    }
  }

  console.log(`[Big Brands Scraper] ${allProducts.length} produits scrapés au total`);
  return allProducts;
}
