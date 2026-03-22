/**
 * Scraper pour analyser les boutiques Shopify
 * Extrait les données réelles : thème, design, apps, etc.
 */

import puppeteer, { type Browser } from 'puppeteer-core';

interface ScrapedStoreData {
  storeName: string;
  logo: string | null;
  theme: {
    name: string | null;
    version: string | null;
  };
  colors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
  };
  fonts: {
    heading: string | null;
    body: string | null;
  };
  navigation: Array<{
    text: string;
    href: string;
  }>;
  apps: string[];
  products: Array<{
    title: string;
    price: string;
    image: string | null;
  }>;
}

/**
 * Scrape une boutique Shopify et extrait les données réelles
 */
export async function scrapeShopifyStore(url: string): Promise<ScrapedStoreData> {
  let browser: Browser | null = null;

  try {
    // Normaliser l'URL
    const normalizedUrl = normalizeShopifyUrl(url);
    
    // Lancer Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Définir un user agent pour éviter la détection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Aller sur la page
    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Vérifier si c'est vraiment une boutique Shopify
    const isShopify = await page.evaluate(() => {
      // Signaux Shopify : scripts, classes CSS, meta tags
      const hasShopifyScript = Array.from(document.querySelectorAll('script[src]')).some(
        (script) => (script as HTMLScriptElement).src.includes('shopify')
      );
      const hasShopifyClass = document.body.className.includes('shopify') || 
                              document.documentElement.className.includes('shopify');
      const hasShopifyMeta = document.querySelector('meta[name="shopify-checkout-api-token"]') !== null ||
                            document.querySelector('meta[property="og:type"][content="product"]') !== null;
      const hasShopifyInHTML = document.documentElement.outerHTML.toLowerCase().includes('shopify');
      
      return hasShopifyScript || hasShopifyClass || hasShopifyMeta || hasShopifyInHTML;
    });

    if (!isShopify) {
      throw new Error('Cette URL ne semble pas être une boutique Shopify. Veuillez vérifier l\'URL.');
    }

    // Attendre que le contenu soit chargé
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraire les données
    const storeData = await page.evaluate(() => {
      // Fonction helper pour extraire les couleurs CSS
      const extractCSSVariable = (varName: string): string | null => {
        const root = document.documentElement;
        const value = getComputedStyle(root).getPropertyValue(varName).trim();
        return value || null;
      };

      // Fonction helper pour extraire les polices
      const extractFont = (selector: string): string | null => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const fontFamily = getComputedStyle(element).fontFamily;
        return fontFamily.split(',')[0].replace(/['"]/g, '').trim() || null;
      };

      // Store name
      const storeName = document.querySelector('title')?.textContent || 
                       document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                       'Boutique Shopify';

      // Logo
      const logoSelectors = [
        'img[alt*="logo" i]',
        '.logo img',
        'header img[alt*="logo" i]',
        '[class*="logo"] img',
        'nav img',
      ];
      let logo: string | null = null;
      for (const selector of logoSelectors) {
        const logoEl = document.querySelector(selector);
        if (logoEl) {
          logo = (logoEl as HTMLImageElement).src;
          break;
        }
      }

      // Thème Shopify
      const themeInfo = {
        name: null as string | null,
        version: null as string | null,
      };

      // Méthode 1 : Via les commentaires HTML
      const htmlContent = document.documentElement.outerHTML;
      const themeComment = htmlContent.match(/<!--\s*Theme:\s*(.+?)\s*-->/i);
      if (themeComment) {
        themeInfo.name = themeComment[1].trim();
      }

      // Méthode 2 : Via les fichiers CSS/JS
      const themeFiles = Array.from(document.querySelectorAll('link[href*="/themes/"], script[src*="/themes/"]'));
      if (themeFiles.length > 0) {
        const href = (themeFiles[0] as HTMLLinkElement).href || (themeFiles[0] as HTMLScriptElement).src;
        const themeMatch = href.match(/\/themes\/([^\/]+)\//);
        if (themeMatch && !themeInfo.name) {
          themeInfo.name = themeMatch[1];
        }
      }

      // Méthode 3 : Via les classes CSS
      if (!themeInfo.name) {
        const bodyClasses = document.body.className;
        const themeClasses = {
          'dawn': bodyClasses.includes('theme-dawn') || htmlContent.includes('theme-dawn'),
          'brooklyn': bodyClasses.includes('theme-brooklyn') || htmlContent.includes('theme-brooklyn'),
          'debut': bodyClasses.includes('theme-debut') || htmlContent.includes('theme-debut'),
          'venture': bodyClasses.includes('theme-venture') || htmlContent.includes('theme-venture'),
        };
        for (const [name, found] of Object.entries(themeClasses)) {
          if (found) {
            themeInfo.name = name;
            break;
          }
        }
      }

      // Version du thème
      const versionMatch = htmlContent.match(/theme_version["']:\s*["']([^"']+)["']/i);
      if (versionMatch) {
        themeInfo.version = versionMatch[1];
      }

      // Couleurs
      const colors = {
        primary: extractCSSVariable('--color-primary') || 
                 extractCSSVariable('--primary-color') ||
                 extractCSSVariable('--color-base') ||
                 null,
        secondary: extractCSSVariable('--color-secondary') ||
                  extractCSSVariable('--secondary-color') ||
                  null,
        accent: extractCSSVariable('--color-accent') ||
               extractCSSVariable('--accent-color') ||
               null,
      };

      // Helper pour convertir RGB en HEX
      function rgbToHex(rgb: string): string {
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return rgb;
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        return '#' + [r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      }

      // Si pas de variables CSS, extraire depuis les styles inline ou classes
      if (!colors.primary) {
        const header = document.querySelector('header');
        if (header) {
          const bgColor = getComputedStyle(header).backgroundColor;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            colors.primary = rgbToHex(bgColor);
          }
        }
      }

      // Polices
      const fonts = {
        heading: extractFont('h1, h2, h3, .heading') || 
                extractFont('[class*="heading"]') ||
                null,
        body: extractFont('body, p, .body') ||
             extractFont('[class*="body"]') ||
             null,
      };

      // Navigation
      const navigation: Array<{ text: string; href: string }> = [];
      const navSelectors = ['nav a', 'header nav a', '[role="navigation"] a'];
      const navLinks = new Set<string>(); // Éviter les doublons

      navSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((link) => {
          const text = link.textContent?.trim();
          const href = (link as HTMLAnchorElement).href;
          if (text && href && !navLinks.has(href)) {
            navLinks.add(href);
            navigation.push({ text, href });
          }
        });
      });

      // Apps installées
      const apps: string[] = [];
      const appPatterns = {
        'klaviyo': /klaviyo\.com|data-klaviyo|klaviyo/i,
        'loox': /loox\.io|loox-rating|loox/i,
        'yotpo': /yotpo\.com|yotpo-widget|yotpo/i,
        'recharge': /rechargeapps\.com|recharge/i,
        'gorgias': /gorgias\.com|gorgias/i,
        'judge': /judge\.me|judge/i,
        'stamped': /stamped\.io|stamped/i,
        'okendo': /okendo\.io|okendo/i,
        'reviews': /reviews\.io|reviews/i,
        'trustpilot': /trustpilot\.com|trustpilot/i,
      };

      const htmlContentLower = htmlContent.toLowerCase();
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      scripts.forEach(script => {
        const src = (script as HTMLScriptElement).src.toLowerCase();
        for (const [appName, pattern] of Object.entries(appPatterns)) {
          if (pattern.test(src) || pattern.test(htmlContentLower)) {
            if (!apps.includes(appName)) {
              apps.push(appName);
            }
          }
        }
      });

      // Produits (premiers visibles sur la homepage)
      const products: Array<{ title: string; price: string; image: string | null }> = [];
      const productSelectors = [
        '.product-card',
        '[class*="product"]',
        '.grid-product',
        '.product-item',
      ];

      productSelectors.forEach(selector => {
        Array.from(document.querySelectorAll(selector)).slice(0, 6).forEach((card) => {
          const titleEl = card.querySelector('a[href*="/products/"], .product-title, h3, h4');
          const priceEl = card.querySelector('.price, [class*="price"], .money');
          const imageEl = card.querySelector('img');

          if (titleEl) {
            products.push({
              title: titleEl.textContent?.trim() || '',
              price: priceEl?.textContent?.trim() || '',
              image: (imageEl as HTMLImageElement)?.src || null,
            });
          }
        });
      });

      return {
        storeName,
        logo,
        theme: themeInfo,
        colors,
        fonts,
        navigation: navigation.slice(0, 10), // Limiter à 10 liens
        apps,
        products: products.slice(0, 6), // Limiter à 6 produits
      };
    });

    console.log('[Scraper] Données extraites avec succès:', {
      storeName: storeData.storeName,
      theme: storeData.theme.name,
      appsCount: storeData.apps.length,
      productsCount: storeData.products.length,
      navigationCount: storeData.navigation.length,
    });
    
    return storeData;
  } catch (error) {
    console.error('[Scraper] Erreur lors du scraping:', error);
    if (error instanceof Error) {
      console.error('[Scraper] Message d\'erreur:', error.message);
      console.error('[Scraper] Stack:', error.stack);
    }
    throw new Error(`Erreur lors de l'analyse de la boutique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Normalise une URL Shopify
 */
function normalizeShopifyUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Si c'est un domaine myshopify.com, utiliser directement
    if (urlObj.hostname.includes('myshopify.com')) {
      return urlObj.toString();
    }
    
    // Sinon, essayer de construire l'URL myshopify.com
    // Note: Cette partie nécessiterait de connaître le store name exact
    // Pour l'instant, on retourne l'URL telle quelle
    return urlObj.toString();
  } catch {
    // Si l'URL est invalide, essayer d'ajouter https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }
}

/**
 * Détecte si une URL est une boutique Shopify
 * Note: Cette fonction est permissive car beaucoup de stores Shopify utilisent des domaines personnalisés
 * La vraie détection se fera lors du scraping en cherchant des signaux Shopify dans le HTML
 */
export function isShopifyStore(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Si c'est clairement un domaine myshopify.com, c'est sûr
    if (urlObj.hostname.includes('myshopify.com')) {
      return true;
    }
    // Sinon, on accepte toutes les URLs valides - le scraping déterminera si c'est vraiment Shopify
    // (en cherchant des signaux comme les scripts Shopify, les classes CSS, etc.)
    return true; // Permissif - le scraping fera la vraie vérification
  } catch {
    return false;
  }
}
