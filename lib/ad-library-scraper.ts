/**
 * Scraper pour Facebook et TikTok Ad Libraries
 * Permet de voir les publicités actives d'une marque
 * GRATUIT - Scraping des pages publiques
 */

// import puppeteer removed

interface AdData {
  platform: 'facebook' | 'tiktok';
  title: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  text: string | null;
  link: string | null;
  date: string | null;
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
  } | null;
}

interface FacebookAd {
  title: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  text: string | null;
  link: string | null;
  date: string | null;
}

interface TikTokAd {
  title: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  text: string | null;
  date: string | null;
}

/**
 * Extrait le nom de la marque depuis une URL
 * Ex: "https://example.com" -> "example"
 */
function extractBrandName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    // Enlever www. et extensions
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
  }
}

/**
 * Scrape Facebook Ad Library pour une marque
 * @param brandName Nom de la marque ou URL
 * @param country Code pays (ex: 'FR', 'US')
 */
export async function scrapeFacebookAds(
  brandName: string,
  country: string = 'FR'
): Promise<FacebookAd[]> {
  let browser: Browser | null = null;

  try {
    // Extraire le nom de la marque
    const brand = brandName.includes('http') ? extractBrandName(brandName) : brandName;

    // URL de Facebook Ad Library
    const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(brand)}&search_type=page&media_type=all`;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[Facebook Ad Library] Scraping pour: ${brand}`);
    await page.goto(adLibraryUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Attendre que les publicités se chargent
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraire les publicités
    const ads = await page.evaluate(() => {
      const adElements: FacebookAd[] = [];
      
      // Sélecteurs pour les publicités Facebook
      // Note: Facebook change souvent sa structure, ces sélecteurs peuvent nécessiter des ajustements
      const adCards = document.querySelectorAll('[data-testid*="ad"], [class*="ad"], [role="article"]');
      
      adCards.forEach((card, index) => {
        if (index >= 10) return; // Limiter à 10 publicités
        
        try {
          // Extraire l'image
          const imageEl = card.querySelector('img');
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src') || null;

          // Extraire la vidéo
          const videoEl = card.querySelector('video');
          const videoUrl = videoEl?.src || videoEl?.getAttribute('data-src') || null;

          // Extraire le texte
          const textEl = card.querySelector('[data-testid*="text"], p, span');
          const text = textEl?.textContent?.trim() || null;

          // Extraire le lien
          const linkEl = card.querySelector('a[href*="facebook.com"]');
          const link = linkEl ? (linkEl as HTMLAnchorElement).href : null;

          // Extraire la date (si disponible)
          const dateEl = card.querySelector('[data-testid*="date"], time');
          const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || null;

          if (imageUrl || videoUrl || text) {
            adElements.push({
              title: text ? text.substring(0, 100) : null,
              imageUrl,
              videoUrl,
              text,
              link,
              date,
            });
          }
        } catch (error) {
          console.warn('Erreur lors de l\'extraction d\'une publicité:', error);
        }
      });

      return adElements;
    });

    console.log(`[Facebook Ad Library] ${ads.length} publicités trouvées`);
    return ads;
  } catch (error) {
    console.error('[Facebook Ad Library] Erreur:', error);
    // Retourner un tableau vide en cas d'erreur (ne pas bloquer l'analyse principale)
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape TikTok Ad Library pour une marque
 * @param brandName Nom de la marque ou URL
 * @param country Code pays (ex: 'FR', 'US')
 */
export async function scrapeTikTokAds(
  brandName: string,
  country: string = 'FR'
): Promise<TikTokAd[]> {
  let browser: Browser | null = null;

  try {
    // Extraire le nom de la marque
    const brand = brandName.includes('http') ? extractBrandName(brandName) : brandName;

    // URL de TikTok Ad Library
    // Note: TikTok Ad Library n'a pas d'URL publique directe comme Facebook
    // On peut utiliser une recherche sur TikTok ou scraper les publicités depuis le site
    const tiktokSearchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(brand)}&t=1`;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[TikTok Ad Library] Scraping pour: ${brand}`);
    await page.goto(tiktokSearchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Attendre que le contenu se charge
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraire les publicités/vidéos
    const ads = await page.evaluate(() => {
      const adElements: TikTokAd[] = [];
      
      // Sélecteurs pour TikTok (structure peut varier)
      const videoCards = document.querySelectorAll('[data-e2e*="video"], [class*="video"], article');
      
      videoCards.forEach((card, index) => {
        if (index >= 10) return; // Limiter à 10
        
        try {
          // Extraire l'image/vidéo
          const imageEl = card.querySelector('img');
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src') || null;

          const videoEl = card.querySelector('video');
          const videoUrl = videoEl?.src || videoEl?.getAttribute('data-src') || null;

          // Extraire le texte/description
          const textEl = card.querySelector('[data-e2e*="desc"], p, span');
          const text = textEl?.textContent?.trim() || null;

          // Extraire la date
          const dateEl = card.querySelector('time, [data-e2e*="time"]');
          const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || null;

          if (imageUrl || videoUrl || text) {
            adElements.push({
              title: text ? text.substring(0, 100) : null,
              imageUrl,
              videoUrl,
              text,
              date,
            });
          }
        } catch (error) {
          console.warn('Erreur lors de l\'extraction d\'une vidéo TikTok:', error);
        }
      });

      return adElements;
    });

    console.log(`[TikTok Ad Library] ${ads.length} publicités/vidéos trouvées`);
    return ads;
  } catch (error) {
    console.error('[TikTok Ad Library] Erreur:', error);
    // Retourner un tableau vide en cas d'erreur
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape les deux Ad Libraries en parallèle
 */
export async function scrapeAllAds(
  brandName: string,
  country: string = 'FR'
): Promise<{
  facebook: FacebookAd[];
  tiktok: TikTokAd[];
}> {
  try {
    // Scraper en parallèle pour plus de rapidité
    const [facebookAds, tiktokAds] = await Promise.allSettled([
      scrapeFacebookAds(brandName, country),
      scrapeTikTokAds(brandName, country),
    ]);

    return {
      facebook: facebookAds.status === 'fulfilled' ? facebookAds.value : [],
      tiktok: tiktokAds.status === 'fulfilled' ? tiktokAds.value : [],
    };
  } catch (error) {
    console.error('[Ad Library Scraper] Erreur globale:', error);
    return {
      facebook: [],
      tiktok: [],
    };
  }
}
