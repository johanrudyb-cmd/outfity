import OpenAI from 'openai';

/** OpenAI / GPT : CHATGPT_API_KEY prioritaire, sinon fallback sur OPENAI_API_KEY */
const openaiApiKey = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn('CHATGPT_API_KEY ou OPENAI_API_KEY non configurée. ChatGPT features will be disabled.');
}

const openai = openaiApiKey
  ? new OpenAI({
    apiKey: openaiApiKey,
  })
  : null;

export async function generateUGCScripts(
  brandName: string,
  productDescription: string,
  count: number = 5,
  tone: string = 'décontracté',
  brandIdentity?: {
    colorPalette?: any;
    typography?: any;
    styleGuide?: any;
  }
): Promise<string[]> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateUGCScripts: claudeUGC } = await import('./claude');
    return claudeUGC(brandName, productDescription, count, tone, brandIdentity);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const scripts: string[] = [];

  // Construire le prompt avec identité de marque
  let identityContext = '';
  if (brandIdentity) {
    if (brandIdentity.colorPalette) {
      const colors = typeof brandIdentity.colorPalette === 'object'
        ? Object.entries(brandIdentity.colorPalette).map(([key, value]) => `${key}: ${value}`).join(', ')
        : '';
      if (colors) {
        identityContext += `Couleurs de la marque : ${colors}. `;
      }
    }

    const styleGuide = brandIdentity.styleGuide as any;
    if (styleGuide) {
      identityContext += `Style guide de base : ${JSON.stringify(styleGuide)}. `;

      // Injecter la MÉMOIRE DE VIRGIL (Insights DA)
      if (styleGuide.virgilInsights) {
        identityContext += `\n[MÉMOIRE VIRGIL (Insights Directeur Artistique)] : ${JSON.stringify(styleGuide.virgilInsights)}. `;
      }
    }
  }

  const toneInstructions: Record<string, string> = {
    décontracté: 'Ton décontracté, authentique, proche des jeunes',
    professionnel: 'Ton professionnel et élégant',
    streetwear: 'Ton streetwear, urbain, cool',
    luxe: 'Ton luxe, premium, sophistiqué',
    fun: 'Ton fun, énergique, positif',
  };

  for (let i = 0; i < count; i++) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es Joy, experte en Growth Marketing et création de contenu viral (UGC) pour marques de mode.
          Ton but est de maximiser l'attention et la conversion.
          RÈGLES DE RÉDACTION :
          1. HOOK (Accroche) : La première phrase doit être ultra-impactante pour arrêter le scroll en moins de 2 secondes.
          2. VALEUR : Le contenu doit être ultra-pertinent, authentique et résoudre un "pain point" ou susciter un désir fort.
          3. STRUCTURE : Hook viral → Problème/Curiosité → Solution (le produit) → Preuve sociale/Bénéfice → CTA puissant.
          4. CTA (Appel à l'action) : Varie les CTA pour encourager soit :
             - Tester l'app gratuitement pendant 3 jours (Essai gratuit).
             - Aller sur le site pour utiliser un outil gratuit ou télécharger un ebook (Page Communauté).
             - Commenter ou partager pour booster l'engagement.
          Ton : ${toneInstructions[tone] || toneInstructions.décontracté}.`,
        },
        {
          role: 'user',
          content: `Génère un script UGC viral pour la marque ${brandName}. 
          ${identityContext}
          Produit : ${productDescription}.
          Le script doit être en français, captivant et suivre les hooks viraux du moment.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const script = completion.choices[0]?.message?.content;
    if (script) {
      scripts.push(script);
    }
  }

  return scripts;
}

export async function generateTechPack(designData: {
  type: string;
  cut: string;
  details: object;
  material: string;
}): Promise<object> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateTechPack: claudeTech } = await import('./claude');
    return claudeTech(designData);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tech packs de mode. 
        Génère un tech pack professionnel au format JSON avec tous les composants nécessaires.`,
      },
      {
        role: 'user',
        content: `Génère un tech pack pour :
        - Type : ${designData.type}
        - Coupe : ${designData.cut}
        - Détails : ${JSON.stringify(designData.details)}
        - Matière : ${designData.material}
        
        Format JSON avec : tissuPrincipal, bordCote, etiquettes, boutons, fermetures, etc.`,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate tech pack');
  }

  return JSON.parse(content);
}

/** Tech pack ultra détaillé (structure visuelle pour fournisseurs) */
export async function generateTechPackVisual(input: {
  type: string;
  cut: string;
  material: string;
  mockupSpec?: Record<string, unknown> | null;
}): Promise<{
  materials: { name: string; composition?: string; weight?: string; ref?: string }[];
  measurementsTable?: { size: string; measurements: Record<string, number> }[];
  trims?: { name: string; ref?: string; placement?: string }[];
  constructionNotes?: string;
  printSpec?: { placement: string; width: number; height: number; technique: string; colors: string[] };
  labeling?: string;
  packaging?: string;
  compliance?: string;
}> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateTechPackVisual: claudeTechPackVisual } = await import('./claude');
    return claudeTechPackVisual(input);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const questionnaire = input.mockupSpec || {};
  const context = [
    `Type: ${input.type}`,
    `Coupe: ${input.cut}`,
    `Matière: ${input.material}`,
    questionnaire ? `Détails questionnaire: ${JSON.stringify(questionnaire)}` : '',
  ].filter(Boolean).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tech packs mode. Génère un tech pack ULTRA DÉTAILLÉ au format JSON pour un fournisseur.
Réponds UNIQUEMENT par un objet JSON valide avec exactement ces clés (en anglais dans le JSON) :
- materials: array de { name, composition?, weight?, ref? } (tissu principal, bord côte, doublure si pertinent)
- measurementsTable: array de { size: "S"|"M"|"L"|"XL", measurements: { longueurTotale, tourPoitrine, tourTaille, tourBassin, longueurManche, etc. } } en cm
- trims: array de { name, ref?, placement? } (boutons, fermeture, étiquettes)
- constructionNotes: string détaillant coutures, ourlets, finitions
- printSpec: { placement, width, height, technique, colors } si visuel/impression
- labeling: string (position et type d'étiquettes)
- packaging: string (pliage, sachet, carton)
- compliance: string (normes OEKO-TEX, pays production, etc.)`,
      },
      {
        role: 'user',
        content: `Génère le tech pack ultra détaillé pour:\n${context}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Tech pack non généré');
  return JSON.parse(content);
}

export async function enhancePrompt(
  userInput: string,
  context: { type: string; style: string }
): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { enhancePrompt: claudeEnhance } = await import('./claude');
    return claudeEnhance(userInput, context);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant pour créer des prompts optimaux pour génération d'images de mode. 
        Améliore les prompts utilisateurs pour obtenir de meilleurs résultats.`,
      },
      {
        role: 'user',
        content: `Améliore ce prompt pour génération d'image de mode :
        "${userInput}"
        
        Contexte : Type ${context.type}, Style ${context.style}.
        Le prompt doit être détaillé, précis et optimisé pour génération IA.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content || userInput;
}

export interface TrendsAnalysisInput {
  byCountry: Array<{ country: string | null; count: number }>;
  byStyle: Array<{ style: string | null; count: number }>;
  byProductType: Array<{ productType: string; count: number }>;
  topTrends?: Array<{ productName: string; productType: string; style: string | null; country: string | null; confirmationScore: number }>;
}

/** Génère une analyse IA des tendances : prévisions pour la France, tendances à venir, recommandations. */
export async function generateTrendsAnalysis(data: TrendsAnalysisInput): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateTrendsAnalysis: claudeTrends } = await import('./claude');
    return claudeTrends(data);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const summary = [
    'Statistiques par pays: ' + (data.byCountry?.map((s) => `${s.country || '—'}: ${s.count}`).join(', ') || 'aucune'),
    'Statistiques par style: ' + (data.byStyle?.map((s) => `${s.style || '—'}: ${s.count}`).join(', ') || 'aucune'),
    'Statistiques par type de produit: ' + (data.byProductType?.map((s) => `${s.productType}: ${s.count}`).join(', ') || 'aucune'),
  ].join('\n');

  const topTrendsText = data.topTrends?.length
    ? 'Tendances principales: ' + data.topTrends.slice(0, 15).map((t) => `${t.productName} (${t.productType}${t.style ? `, ${t.style}` : ''}${t.country ? `, ${t.country}` : ''}, score ${t.confirmationScore})`).join(' ; ')
    : '';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tendances mode et retail en France et en Europe.
Tu analyses des données de tendances (produits détectés chez plusieurs marques) et tu rédiges des analyses courtes, structurées et actionnables.
Réponds en français, avec des paragraphes clairs. Inclus notamment :
1. Les tendances à venir en France (ce qui monte, ce qui va cartonner).
2. Des prévisions à 6–12 mois sur les styles, coupes et catégories.
3. Des recommandations concrètes pour les marques et créateurs.`,
      },
      {
        role: 'user',
        content: `À partir des données suivantes, rédige une analyse approfondie des tendances (prévisions France, tendances à venir, recommandations).\n\n${summary}\n${topTrendsText ? '\n' + topTrendsText : ''}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 1200,
  });

  return completion.choices[0]?.message?.content || 'Aucune analyse générée.';
}

/** Entrée pour une analyse individuelle d’un produit / tendance */
export interface ProductTrendInput {
  productName: string;
  productType: string;
  cut?: string | null;
  material?: string | null;
  color?: string | null;
  style?: string | null;
  country?: string | null;
  brands: string[];
  averagePrice: number;
  confirmationScore: number;
}

/** Génère une analyse IA pour un seul produit : potentiel en France, positionnement, recommandations. */
export async function generateProductTrendAnalysis(product: ProductTrendInput): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateProductTrendAnalysis: claudeProduct } = await import('./claude');
    return claudeProduct(product);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const desc = [
    `Produit : ${product.productName}`,
    `Type : ${product.productType}`,
    product.cut ? `Coupe : ${product.cut}` : null,
    product.material ? `Matière : ${product.material}` : null,
    product.color ? `Couleur : ${product.color}` : null,
    product.style ? `Style : ${product.style}` : null,
    product.country ? `Pays : ${product.country}` : null,
    `Marques où il est présent : ${product.brands.join(', ')}`,
    `Prix moyen : ${product.averagePrice.toFixed(2)} €`,
    `Score de confirmation : ${product.confirmationScore}/5`,
  ]
    .filter(Boolean)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tendances mode et retail en France.
Tu analyses un produit (tendance détectée chez plusieurs marques) et tu rédiges une analyse courte et actionnable, en français.
Inclus : potentiel de ce produit en France, positionnement par rapport au marché, et 2–3 recommandations concrètes (création, prix, cible).`,
      },
      {
        role: 'user',
        content: `Analyse ce produit et donne une analyse individuelle (potentiel France, positionnement, recommandations).\n\n${desc}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content || 'Aucune analyse générée.';
}

/** Génère un prompt texte pour générer une image produit (à envoyer à Higgsfield). */
export async function generateProductImagePrompt(product: {
  productName: string;
  productType: string;
  cut?: string | null;
  material?: string | null;
  color?: string | null;
  style?: string | null;
}): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateProductImagePrompt: claudePrompt } = await import('./claude');
    return claudePrompt(product);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const desc = [
    product.productName,
    product.productType,
    product.cut ?? '',
    product.material ?? '',
    product.color ?? '',
    product.style ?? '',
  ]
    .filter(Boolean)
    .join(', ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en visuels mode. Tu génères un prompt court en anglais pour une IA de génération d'image (type FLUX / DALL-E).
Le prompt doit décrire UNE PHOTO DE PRODUIT MODE : vêtement ou accessoire, sur mannequin ou flat lay, fond neutre, lumière professionnelle, style e-commerce.
Réponds UNIQUEMENT par le prompt, sans phrase d'intro. 1 à 2 lignes max. Exemple: "Professional product photography of a [type] [cut] [material], [color], [style], on white background, studio lighting, 8k".`,
      },
      {
        role: 'user',
        content: `Génère un prompt pour une image produit : ${desc}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 150,
  });

  const prompt = completion.choices[0]?.message?.content?.trim();
  if (!prompt) throw new Error('Aucun prompt généré');
  return prompt;
}

/** Entrée pour l’analyse tendance + prompt image (après scrape) */
export interface TrendEnrichmentInput {
  productName: string;
  productType: string;
  cut?: string | null;
  material?: string | null;
  color?: string | null;
  style?: string | null;
  brands: string[];
  averagePrice: number;
  confirmationScore: number;
  country?: string | null;
}

/** Réponse structurée : conseils tendance, note 1-10, prompt pour image Higgsfield */
export interface TrendEnrichmentResult {
  advice: string;
  rating: number;
  imagePrompt: string;
}

/**
 * À partir des infos scrapées d’une tendance, GPT renvoie :
 * - conseils sur la tendance (bon ou pas, recommandations),
 * - une note 1-10 (potentiel),
 * - un prompt court en anglais pour générer l’image du vêtement (Higgsfield).
 */
export async function generateTrendAdviceAndImagePrompt(
  product: TrendEnrichmentInput
): Promise<TrendEnrichmentResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateTrendAdviceAndImagePrompt: claudeAdvice } = await import('./claude');
    return claudeAdvice(product);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const desc = [
    `Produit : ${product.productName}`,
    `Type : ${product.productType}`,
    product.cut ? `Coupe : ${product.cut}` : null,
    product.material ? `Matière : ${product.material}` : null,
    product.color ? `Couleur : ${product.color}` : null,
    product.style ? `Style : ${product.style}` : null,
    `Présent chez ${product.brands.length} marques (score ${product.confirmationScore})`,
    `Prix moyen : ${product.averagePrice.toFixed(2)} €`,
    product.country ? `Marché : ${product.country}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tendances mode et retail en France.
À partir des infos d'un produit détecté chez plusieurs marques (données scrapées), tu dois répondre en JSON strict avec exactement 3 champs :
- "advice" : 2 à 4 phrases en français. Conseils sur la tendance : est-ce une bonne tendance à suivre ou à éviter, pourquoi, recommandations concrètes (cible, prix, positionnement).
- "rating" : un nombre entier entre 1 et 10 (10 = tendance très forte à suivre, 1 = à éviter).
- "imagePrompt" : une seule phrase en anglais pour générer une photo produit e-commerce (vêtement sur fond neutre, lumière pro, style catalogue). Exemple : "Professional product photography of a [type] [cut] [material], [color], on white background, studio lighting, 8k".

Réponds UNIQUEMENT par un objet JSON valide, sans markdown ni texte autour.`,
      },
      {
        role: 'user',
        content: `Analyse cette tendance et renvoie advice, rating et imagePrompt.\n\n${desc}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Réponse GPT vide');

  let parsed: { advice?: string; rating?: number; imagePrompt?: string };
  try {
    parsed = JSON.parse(raw) as { advice?: string; rating?: number; imagePrompt?: string };
  } catch {
    throw new Error('Réponse GPT invalide (JSON attendu)');
  }

  const advice = typeof parsed.advice === 'string' ? parsed.advice.trim() : '';
  const rating = typeof parsed.rating === 'number'
    ? Math.min(10, Math.max(1, Math.round(parsed.rating)))
    : 5;
  const imagePrompt = typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt.trim() : '';

  if (!advice || !imagePrompt) {
    throw new Error('Réponse GPT incomplète (advice et imagePrompt requis)');
  }

  return { advice, rating, imagePrompt };
}

/** Résultat de l’analyse visuelle IA (Trend Radar Hybride - GPT-4o) */
export interface VisualTaggingResult {
  cut: string;
  attributes: {
    materialVisible?: string;
    collarType?: string;
    colorExact?: string;
    [key: string]: string | undefined;
  };
  trendScoreVisual: number;
  productSignature: string;
}

/**
 * Analyse visuelle d’un produit (image + titre) avec GPT-4o.
 * Identifie coupe, attributs clés (matière, col, couleur) et score de tendance.
 */
export async function analyzeProductImage(
  imageUrl: string,
  title: string
): Promise<VisualTaggingResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { analyzeProductImage: claudeAnalyze } = await import('./claude');
    return claudeAnalyze(imageUrl, title);
  }
  if (!openai) {
    throw new Error('CHATGPT_API_KEY ou ANTHROPIC_API_KEY requise pour l\'analyse visuelle.');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Tu es un expert mode. Analyse cette image produit (e-commerce) et le titre suivant.

Titre: "${title}"

Réponds en JSON strict avec exactement ces champs:
- "cut": la coupe (ex: Boxy, Slim, Oversized, Regular, Wide Leg). Une seule valeur.
- "attributes": objet avec "materialVisible" (matière visible), "collarType" (type de col si visible), "colorExact" (couleur exacte).
- "trendScoreVisual": nombre entre 0 et 100, score de tendance basé sur la récurrence visuelle actuelle (100 = très tendance).
- "productSignature": une chaîne normalisée pour le matching multi-zones, ex: "veste-sans-manche_cargo" ou "hoodie_oversized_coton". Pas d'espaces, minuscules, tirets. Résume le type de vêtement + coupe + 1-2 attributs clés.

Réponds UNIQUEMENT par un objet JSON valide, sans markdown.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Réponse GPT-4o vide');

  let parsed: {
    cut?: string;
    attributes?: Record<string, string>;
    trendScoreVisual?: number;
    productSignature?: string;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error('Réponse GPT-4o invalide (JSON attendu)');
  }

  const cut = typeof parsed.cut === 'string' ? parsed.cut.trim() : 'Regular';
  const attributes = parsed.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {};
  const trendScoreVisual = typeof parsed.trendScoreVisual === 'number'
    ? Math.min(100, Math.max(0, Math.round(parsed.trendScoreVisual)))
    : 50;
  const productSignature = typeof parsed.productSignature === 'string'
    ? parsed.productSignature.replace(/\s+/g, '-').toLowerCase().slice(0, 120)
    : `${cut}-${Object.values(attributes).filter(Boolean).join('-')}`.replace(/\s+/g, '-').toLowerCase().slice(0, 120);

  return {
    cut,
    attributes,
    trendScoreVisual,
    productSignature: productSignature || 'unknown',
  };
}

/**
 * Génère une analyse business pour une tendance multi-zones (Trend Radar Hybride).
 * Ex: "Le marché US sature sur ce produit, opportunité de lancement immédiat sur le marché EU."
 */
export async function generateBusinessAnalysisForZones(
  productName: string,
  zones: string[],
  trendScoresByZone: Record<string, number>,
  averagePrice?: number
): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateBusinessAnalysisForZones: claudeBiz } = await import('./claude');
    return claudeBiz(productName, zones, trendScoresByZone);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const zonesList = zones.join(', ');
  const scoresText = Object.entries(trendScoresByZone)
    .map(([z, s]) => `${z}: ${s}/100`)
    .join(' ; ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert retail mode mondial. Rédige une "Analyse Business" stratégique de 2 à 4 phrases.
Inclus IMPÉRATIVEMENT :
1. Analyse de saturation par zone (ex: "Le marché US sature, opportunité forte en EU").
2. Insight financier : Estime un "Coût de production" (COGS) probable (environ 20-30% du prix retail) et un "Prix de vente conseillé" (MSRP) pour une marque DTC indépendante, basé sur le prix moyen observé (${averagePrice ? averagePrice.toFixed(2) + '€' : 'prix inconnu'}).
3. Potentiel de marge.
Réponds en français avec un ton expert et audacieux.`,
      },
      {
        role: 'user',
        content: `Produit : ${productName}. Zones : ${zonesList}. Scores : ${scoresText}. Prix moyen observé : ${averagePrice ? averagePrice.toFixed(2) + '€' : 'N/A'}.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Aucune analyse.';
}

/** Champs enrichis par IA pour un produit tendance (hors segment et marketZone). */
export interface EnrichedProductFields {
  category?: string;
  style?: string;
  material?: string;
  color?: string;
  careInstructions?: string;
  description?: string;
  cut?: string;
  productBrand?: string;
  estimatedCogsPercent?: number;
  complexityScore?: string;
  sustainabilityScore?: number;
  visualAttractivenessScore?: number;
  dominantAttribute?: string;
  businessAnalysis?: string;
}

/**
 * Enrichit les champs manquants d'un produit tendance via IA.
 * Ne modifie pas segment ni marketZone.
 * Utilise l'image si disponible (GPT-4o vision) pour visuels/design.
 */
function normalizeEnrichedFields(parsed: Record<string, unknown>): EnrichedProductFields {
  const out: EnrichedProductFields = {};
  if (typeof parsed.category === 'string' && parsed.category.trim()) {
    const cat = parsed.category.trim().slice(0, 50);
    if (cat !== 'Autre' && cat !== 'autres') out.category = cat;
  }
  if (typeof parsed.style === 'string' && parsed.style.trim()) out.style = parsed.style.trim().slice(0, 100);
  if (typeof parsed.material === 'string' && parsed.material.trim()) out.material = parsed.material.trim().slice(0, 200);
  if (typeof parsed.color === 'string' && parsed.color.trim()) out.color = parsed.color.trim().slice(0, 80);
  if (typeof parsed.careInstructions === 'string' && parsed.careInstructions.trim()) out.careInstructions = parsed.careInstructions.trim().slice(0, 500);
  if (typeof parsed.description === 'string' && parsed.description.trim()) out.description = parsed.description.trim().slice(0, 2000);
  if (typeof parsed.cut === 'string' && parsed.cut.trim()) out.cut = parsed.cut.trim().slice(0, 60);
  if (typeof parsed.productBrand === 'string' && parsed.productBrand.trim()) {
    // Nettoyage marque : on retire les points, tirets ou mentions 'Zalando'
    let brand = parsed.productBrand.trim()
      .replace(/^(Zalando|ASOS|Zara|Retailer)\s*[-|–]?\s*/i, '')
      .replace(/[._\-]+$/g, '')
      .trim();
    if (brand.length >= 2) out.productBrand = brand.slice(0, 80);
  }
  if (typeof parsed.estimatedCogsPercent === 'number') out.estimatedCogsPercent = Math.min(50, Math.max(15, Math.round(parsed.estimatedCogsPercent)));
  if (typeof parsed.complexityScore === 'string' && ['Facile', 'Moyen', 'Complexe', 'Différent'].includes(parsed.complexityScore)) {
    out.complexityScore = parsed.complexityScore === 'Différent' ? 'Complexe' : parsed.complexityScore as any;
  }
  if (typeof parsed.sustainabilityScore === 'number') out.sustainabilityScore = Math.min(100, Math.max(0, Math.round(parsed.sustainabilityScore)));
  if (typeof parsed.visualAttractivenessScore === 'number') out.visualAttractivenessScore = Math.min(100, Math.max(0, Math.round(parsed.visualAttractivenessScore)));
  if (typeof parsed.dominantAttribute === 'string' && parsed.dominantAttribute.trim()) out.dominantAttribute = parsed.dominantAttribute.trim().slice(0, 300);
  if (typeof parsed.businessAnalysis === 'string' && parsed.businessAnalysis.trim()) {
    // S'assurer que l'analyse est pro et pas trop longue
    out.businessAnalysis = parsed.businessAnalysis.trim().slice(0, 1500);
  }
  return out;
}

export async function enrichProductDetails(
  product: {
    name: string;
    category: string;
    productBrand?: string | null;
    material?: string | null;
    style?: string | null;
    color?: string | null;
    careInstructions?: string | null;
    description?: string | null;
    cut?: string | null;
    averagePrice: number;
    imageUrl?: string | null;
    estimatedCogsPercent?: number | null;
    complexityScore?: string | null;
    sustainabilityScore?: number | null;
    visualAttractivenessScore?: number | null;
    dominantAttribute?: string | null;
    skipImageAnalysis?: boolean;
  }
): Promise<EnrichedProductFields> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { enrichProductDetails: claudeEnrich } = await import('./claude');
    const raw = await claudeEnrich(product);
    return normalizeEnrichedFields(raw as Record<string, unknown>);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const existing = [
    product.material ? `Matière: ${product.material}` : null,
    product.style ? `Style: ${product.style}` : null,
    product.color ? `Couleur: ${product.color}` : null,
    product.cut ? `Coupe: ${product.cut}` : null,
  ].filter(Boolean).join('; ');

  const marketTruth = require('./market-truth.json');
  const marketSignals = JSON.stringify(marketTruth.trendingSignals);

  const systemPrompt = `Tu es Outfity Intelligence, l'algorithme IA leader pour la détection de tendances sociales et la curation de mode.
Ton rôle est de générer la fiche technique et stratégique d'un produit en te basant sur des signaux de viralité sociale.

Voici les signaux de marché actuels à utiliser pour ta validation (Base de Vérité Outfity) :
${marketSignals}

Règles JSON strictes:
- "businessAnalysis": Analyse stratégique ELITE (TikTok trends, Aesthetics). INCLUS IMPÉRATIVEMENT une estimation du "Coût de production" (ex: 12-18€) et du "Prix de vente potentiel" pour une marque indépendante (ex: 45-55€) en te basant sur le prix public de ${product.averagePrice}€.
- "dominantAttribute": Le "Killer Detail" viral (ex: "Le délavage Vintage Wash qui domine actuellement sur TikTok").
- "style": Style précis (Streetwear, Minimaliste, Luxury, Y2K, Gorpcore, Workwear, Old Money, Clean Girl, Quiet Luxury).
- "complexityScore": "Facile" | "Moyen" | "Complexe".
- "estimatedCogsPercent": Coût de prod estimé (15-50%).
- "sustainabilityScore": Note ESG (0-100).
- "visualAttractivenessScore": Note IVS (Indice de Viralité Sociale) de 0 à 100.
- "category": Type exact (Hoodie, Cargo, Veste, etc.). Jamais "Autre".
- "material": Si non spécifié, déduis la matière probable (ex: "Coton lourd 400g", "Nylon Ripstop").
- "productBrand": Utilise la marque fournie ("Marque fournie"). Si non fournie, extrait la marque réelle du produit (ex: "NIKE", "COLLUSION", "ADIDAS") et ignore le distributeur (Zalando/ASOS). NE PAS INVENTER de marque si elle n'est pas évidente.
- "shorten": Analyse business concise.

IMPORTANT: Ton analyse doit être "bold" (audacieuse) et experte. Ne répète jamais le nom de la marque dans le champ "businessAnalysis" ou "dominantAttribute" inutilement.`;

  const userContent = [
    `Produit: ${product.name}`,
    `Marque fournie: ${product.productBrand || 'Inconnue'}`,
    `Catégorie initiale: ${product.category}`,
    `Prix public: ${product.averagePrice}€`,
    existing ? `Données existantes: ${existing}` : '',
    '',
    product.skipImageAnalysis ? 'REMARQUE: Analyse business CONCISE (1 paragraphe) car traitement par lot.' : '',
    'Analyse ce vêtement et renvoie le JSON complet avec : businessAnalysis, dominantAttribute, style, material, color, careInstructions, description, cut, productBrand (la vraie marque, pas Zalando), estimatedCogsPercent, complexityScore, sustainabilityScore, visualAttractivenessScore, category.',
  ].filter(Boolean).join('\n');

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const canAnalyzeImage = product.imageUrl &&
    product.imageUrl.startsWith('http') &&
    !product.skipImageAnalysis;

  if (canAnalyzeImage) {
    messages[1] = {
      role: 'user',
      content: [
        { type: 'text', text: userContent + '\n\nAnalyse aussi cette image produit pour compléter cut, color, productBrand, visualAttractivenessScore, dominantAttribute.' },
        { type: 'image_url', image_url: { url: product.imageUrl } },
      ],
    } as OpenAI.ChatCompletionMessageParam;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 500,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeEnrichedFields(parsed);
  } catch {
    return {};
  }
}

/** Contexte optionnel depuis les données curatées (Marques tendances). */
export interface BrandAnalysisContext {
  signaturePiece?: string;
  dominantStyle?: string;
  cyclePhase?: string;
  launchPotential?: string;
  indicativePrice?: string;
  rank?: number;
  score?: string;
}

/**
 * Génère une analyse complète de marque pour un créateur qui veut lancer sa marque.
 * Couvre : positionnement, cible, marketing, forces/opportunités, recommandations.
 */
export async function generateBrandAnalysis(
  brandName: string,
  context?: BrandAnalysisContext
): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateBrandAnalysis: claudeBrand } = await import('./claude');
    return claudeBrand(brandName, context);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  let contextStr = '';
  if (context) {
    const parts: string[] = [];
    if (context.signaturePiece) parts.push(`Pièce maîtresse tendance : ${context.signaturePiece}`);
    if (context.dominantStyle) parts.push(`Style dominant : ${context.dominantStyle}`);
    if (context.cyclePhase) parts.push(`Phase du cycle : ${context.cyclePhase}`);
    if (context.launchPotential) parts.push(`Potentiel de lancement : ${context.launchPotential}`);
    if (context.indicativePrice) parts.push(`Prix indicatif : ${context.indicativePrice}`);
    if (context.rank) parts.push(`Rang tendance EU : #${context.rank}`);
    if (context.score) parts.push(`Score tendance : ${context.score}`);
    if (parts.length > 0) {
      contextStr = `\n\nContexte tendances EU :\n${parts.join('\n')}`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en stratégie mode et retail, spécialisé dans l'accompagnement des créateurs de marques de vêtements.

Tu rédiges des analyses de marque COMPLÈTES et ACTIONNABLES, avec la même structure que la stratégie marketing dans "gérer ma marque".
Structure ton analyse en sections claires avec des titres ##. Réponds UNIQUEMENT en français.
Interdit le gras markdown (**). Interdit les hashtags bruts (#xxx) : reformule en "thèmes : …" ou en mots simples.
Sois concret, factuel et orienté action.`,
      },
      {
        role: 'user',
        content: `Analyse la marque "${brandName}" et rédige une analyse complète pour un créateur qui veut lancer sa marque de vêtements (ou accessoires).${contextStr}

Structure obligatoire (identique à la stratégie marketing dans "gérer ma marque") — les 7 sections ci-dessous :

## 1. Vision et positionnement
Positionnement de la marque sur le marché, identité, codes, promesse. Comment se différencie-t-elle ? Comment un créateur peut s'en inspirer.

## 2. Cible et client idéal
Qui sont les clients de cette marque ? Profil socio-démo, aspirations, habitudes d'achat. Où les trouver (canaux, communautés) ?

## 3. Offre et pricing
Fourchettes de prix, structure de gamme, promotions. Recommandations pour un créateur (prix d'entrée, positionnement prix).

## 4. Canaux et marketing
Comment la marque communique ? Canaux (réseaux, influence, retail, événements), tonalité, type de contenu. Ce qui fonctionne pour eux et comment le transposer.

## 5. Messages clés et storytelling
Thèmes récurrents, angles de communication, codes. Formulations à adapter pour une nouvelle marque.

## 6. Stratégie de contenu
Types de contenu (posts, stories, vidéos, lookbooks), calendrier éditorial, thèmes par canal, fréquence de publication, formats (UGC, behind-the-scenes). Ce qui fonctionne pour cette marque.

## 7. Site internet
Ce qui fonctionne sur le site e-commerce de cette marque (structure, UX, confiance, visuels, conversion). Recommandations pour un créateur qui lance son site.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Aucune analyse générée.';
}

/** Contexte pour générer la description produit (marque + stratégie + identité). */
export interface ProductDescriptionContext {
  brandName: string;
  styleGuide?: { preferredStyle?: string; positioning?: string; targetAudience?: string; productType?: string; tagline?: string; description?: string; story?: string } | null;
  phase1Data?: { productType?: string; weight?: string } | null;
  phaseSummaries?: Record<string, string> | null;
  designType: string;
  designCut?: string | null;
  designMaterial?: string | null;
  techPackSummary?: string | null;
}

/**
 * Génère une description produit e-commerce à partir de la marque, stratégie (phase 1) et identité.
 * Utilisée après validation du tech pack dans Design et Tech Pack.
 */
export async function generateProductDescriptionFromBrand(context: ProductDescriptionContext): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { generateProductDescriptionFromBrand: claudeGen } = await import('./claude');
    return claudeGen(context);
  }
  if (!openai) {
    throw new Error('ChatGPT API key not configured');
  }

  const parts: string[] = [
    `Marque : ${context.brandName}.`,
    context.styleGuide?.story ? `Histoire / raison d'être de la marque (donner du sens, âme) : ${context.styleGuide.story}.` : '',
    context.styleGuide?.preferredStyle ? `Style / positionnement : ${context.styleGuide.preferredStyle}.` : '',
    context.styleGuide?.positioning ? `Positionnement : ${context.styleGuide.positioning}.` : '',
    context.styleGuide?.targetAudience ? `Cible : ${context.styleGuide.targetAudience}.` : '',
    context.styleGuide?.tagline ? `Slogan : ${context.styleGuide.tagline}.` : '',
    context.phase1Data?.productType ? `Type produit stratégie : ${context.phase1Data.productType}.` : '',
    context.phase1Data?.weight ? `Grammage : ${context.phase1Data.weight}.` : '',
    context.phaseSummaries && Object.keys(context.phaseSummaries).length > 0
      ? `Résumés phases : ${JSON.stringify(context.phaseSummaries)}.`
      : '',
    `Design : ${context.designType}${context.designCut ? `, coupe ${context.designCut}` : ''}${context.designMaterial ? `, ${context.designMaterial}` : ''}.`,
    context.techPackSummary ? `Tech pack (résumé) : ${context.techPackSummary}.` : '',
  ].filter(Boolean);

  const userContent = `Contexte marque et produit :\n${parts.join('\n')}\n\nRédige une description produit e-commerce en français (2 à 4 phrases), vendeuse et alignée avec l'identité de la marque. Si une histoire ou raison d'être de la marque est fournie, donne du sens et de l'âme à la description pour que les gens s'y retrouvent. Mets en valeur le produit (${context.designType}), les matières/coupe si connus, et le positionnement. Pas de titre, uniquement le paragraphe de description.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Tu es un rédacteur e-commerce mode. Tu rédiges des descriptions produit courtes, engageantes et alignées avec l\'identité de la marque. Ton français est fluide et sans faute. Réponds UNIQUEMENT par le texte de la description, sans préambule.',
      },
      { role: 'user', content: userContent },
    ],
    temperature: 0.6,
    max_tokens: 400,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error('Aucune description générée');
  return text;
}

export function isChatGptConfigured(): boolean {
  return !!process.env.CHATGPT_API_KEY;
}

/** Vrai si au moins une IA est configurée pour l'analyse visuelle (GPT-4o ou Claude vision). */
export function isVisualAnalysisConfigured(): boolean {
  return !!process.env.CHATGPT_API_KEY || !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
}

/** Teste que la clé API GPT répond (appel minimal). */
export async function testGptConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!openai) {
    return { ok: false, error: 'CHATGPT_API_KEY non configurée' };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Réponds uniquement par : OK' },
      ],
      max_tokens: 10,
      temperature: 0,
    });
    const text = completion.choices[0]?.message?.content?.trim() || '';
    return text ? { ok: true } : { ok: false, error: 'Réponse vide' };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Valide si un produit est bien un vêtement/article de mode textile (Keep)
 * ou s'il doit être banni (Beauté, Cosmétique, Parfum, Soins, etc.)
 */
export async function isProductValidClothing(
  imageUrl: string,
  title: string
): Promise<{ valid: boolean; reason: string }> {
  if (!openai) return { valid: true, reason: 'AI disabled' };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un modérateur pour une plateforme de mode premium (VÊTEMENTS TEXTILES UNIQUEMENT).
          Ta mission est de bannir tout ce qui n'est pas un vêtement (haut ou bas).
          
          DOIVENT ÊTRE BANNIS (valid: false) :
          - Sacs, sacs à main, tote bags, sacs à dos.
          - Chaussures, sneakers, bottes, talons.
          - Chapeaux, casquettes, bonnets.
          - Ceintures, bijoux, lunettes de soleil, montres.
          - Maquillage, parfums, cosmétiques.
          - Décoration, objets, électroménager.
          
          DOIVENT ÊTRE GARDÉS (valid: true) :
          - Uniquement les vêtements : T-shirts, hoodies, pulls, pantalons, jeans, vestes, manteaux.
          - Robes, jupes, chemises, shorts, survêtements.
          
          Réponds UNIQUEMENT en JSON : {"valid": boolean, "reason": "courte explication"}.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Produit: "${title}"` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return { valid: true, reason: 'Empty response' };

    const parsed = JSON.parse(raw);
    return {
      valid: !!parsed.valid,
      reason: parsed.reason || ''
    };
  } catch (error) {
    console.error('Error in isProductValidClothing:', error);
    return { valid: true, reason: 'Error fallback' };
  }
}

/**
 * Génère le Top 10 des marques tendances du mois via IA.
 * Analyse le marché européen/français actuel.
 */
export async function generateMonthlyTrendingBrands(): Promise<Array<{
  rank: number;
  brand: string;
  score: string;
  scoreValue: number;
  signaturePiece: string;
  dominantStyle: string;
  cyclePhase: string;
  launchPotential: string;
  indicativePrice: string;
  websiteUrl: string;
}>> {
  if (!openai) throw new Error('AI not configured');

  const now = new Date();
  const monthStr = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en tendances mode et retail global(Luxe, Streetwear et Mass Market) en Europe. 
        Ta mission est de générer le classement TOP 10 des marques les plus influentes et "hot" du mois de ${monthStr}.

          IMPORTANT : Tu dois proposer un mix équilibré de segments pour que le classement reflète la réalité du marché :
        - Inclus des marques de LUXE(ex: Loewe, Jacquemus).
        - Inclus des marques STREETWEAR / NICHE(ex: Corteiz, Represent, Stüssy).
        - Inclus des marques MASS MARKET influentes(ex: Zara, Uniqlo, Adidas).
        
        Pour chaque marque, tu dois fournir :
        - brand: Nom de la marque.
        - score: Score sur 100(ex: "98/100").
        - scoreValue: La valeur numérique du score(ex: 98).
        - signaturePiece: La pièce maîtresse qui fait le buzz actuellement(ex: "Veste Alpha SV").
        - dominantStyle: Le style associé(ex: "Gorpcore", "Quiet Luxury", "Streetwear").
        - cyclePhase: "emergent", "croissance", "pic" ou "declin".
        - launchPotential: "opportunite", "a_surveiller" ou "sature".
        - indicativePrice: Fourchette de prix(ex: "40-100€").
        - websiteUrl: URL officielle du site web de la marque(ex: "https://www.jacquemus.com").
        
        Réponds UNIQUEMENT par un objet JSON avec une clé "brands" contenant un tableau de 10 objets.`,
      },
      {
        role: 'user',
        content: `Génère le classement TOP 10 mixé(Luxe, Streetwear, Mass Market) des marques de mode tendances en Europe pour ${monthStr}.`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw);
  const brands = parsed.brands || [];

  return brands.map((b: any, index: number) => ({
    rank: index + 1,
    brand: b.brand,
    score: b.score || `${b.scoreValue} / 100`,
    scoreValue: b.scoreValue,
    signaturePiece: b.signaturePiece,
    dominantStyle: b.dominantStyle,
    cyclePhase: b.cyclePhase,
    launchPotential: b.launchPotential,
    indicativePrice: b.indicativePrice || '',
    websiteUrl: b.websiteUrl || '',
  }));
}

/**
 * Analyse une image de mode pour en extraire les tendances (GPT-4o Vision).
 */
export async function analyzeVisualTrend(base64Image: string): Promise<{
  category: string;
  style: string;
  tags: string[];
  materials: string[];
  colors: string[];
  baseTrendScore: number;
  analysis: string;
  cyclePhase: 'emergent' | 'croissance' | 'pic' | 'declin';
  marketAdvice: string;
}> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { analyzeVisualTrend: claudeVisualTrend } = await import('./claude');
    return claudeVisualTrend(base64Image);
  }
  if (!openai) throw new Error('AI not configured');

  // Nettoyer le préfixe base64 si présent
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Tu es un expert en analyse de tendances mode (Fashion Trend Analyst) spécialisé UNIQUEMENT dans les vêtements.

RÈGLE CRITIQUE : Tu n'analyses QUE les vêtements portés sur le corps (t-shirt, pantalon, robe, veste, sweat, manteau, jupe, short, maillot de sport, etc.).
RÈGLE CRITIQUE 2 : Tu DOIS répondre entièrement en FRANÇAIS (valeurs JSON incluses). Si tu détectes "oversized hoodie", écris "Sweat à capuche oversize".
RÈGLE CRITIQUE 3 : Ne mentionne JAMAIS de genre (Homme/Femme/Garçon/Fille) dans les catégories, tags ou analyses. Part du principe que tout vêtement est non genré (unisexe).

SCORING (baseTrendScore de 0 à 100) : 
Pour calculer ton "baseTrendScore", tu DOIS croiser ces 3 données pour faire un calcul global :
1. LE DESIGN LUI-MÊME : Esthétique, coupe, détails. Est-ce que le design a un fort potentiel (minimaliste efficace, streetwear pointu, etc.) ?
2. SAISONNALITÉ & ÉVÉNEMENTS (Locaux en France et Internationaux) : Est-ce la bonne période (été/hiver) ? Y a-t-il des événements culturels/sportifs (JO, Euro, Coupe du Monde, Festivals, Fashion Week) qui boostent cette esthétique (ex: maillots sport pendant un tournoi) ?
3. VIRALITÉ TIKTOK/INSTA PAR CATÉGORIE : Est-ce que la catégorie globale du vêtement (t-shirt crop, sweat oversize, maillot) est un banger absolu sur les réseaux en ce moment ?
- Une pièce basique (t-shirt basique mais dont la coupe/couleur cartonne) en pleine saison peut avoir >90/100. Ne bride jamais tes notes juste parce que c'est "simple" ou "sport".

Si l'image montre autre chose qu'un vêtement (sac à main, chaussures, accessoire, bijou, montre, ceinture, chapeau, meuble, nourriture, personne sans vêtement visible, etc.), tu DOIS retourner :
{ "isClothingItem": false, "rejectionReason": "description courte de ce qui est visible (NE MENTIONNE JAMAIS que tu es une IA, ni GPT, ni Claude, sois direct)" }

Si l'image contient bien un vêtement, réponds avec isClothingItem: true et la structure complète en FRANÇAIS UNIQUEMENT :
{
  "isClothingItem": true,
  "category": "Type de vêtement principal (ex: T-shirt, Pantalon, Maillot de sport, Robe)",
  "style": "Style identifié (ex: Urbain, Blokecore, Y2K, Sportswear)",
  "tags": ["tag1", "tag2", "tag3"],
  "materials": ["matière1", "..."],
  "colors": ["couleur1", "..."],
  "baseTrendScore": 0,
  "analysis": "Description courte de l'esthétique et de pourquoi c'est tendance",
  "cyclePhase": "emergent",
  "marketAdvice": "Conseil business actionnable pour une marque de mode"
}
TRÈS IMPORTANT: AUCUN MOT ANGLAIS pour les styles, catégories ou tags (sauf termes consacrés comme Blokecore ou Y2K), traduis tout en français et supprime TOUTE notion de genre.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse uniquement si c'est un vêtement. Sinon, rejette. TOUTES LES DONNÉES DOIVENT ÊTRE EN FRANÇAIS." },

          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw);

  // Rejet si l'IA détecte que ce n'est pas un vêtement
  if (parsed.isClothingItem === false) {
    const reason = parsed.rejectionReason || 'objet non reconnu';
    throw Object.assign(new Error(`NOT_CLOTHING:${reason}`), { code: 'NOT_CLOTHING', reason });
  }

  // Nettoyage du champ isClothingItem avant de retourner
  const { isClothingItem: _, ...result } = parsed;
  return result;
}
/**
 * Récupère les métadonnées rapides d'une marque (pour indexation).
 */
export async function getBrandQuickMetadata(brandName: string): Promise<{
  websiteUrl: string;
  signaturePiece: string;
  dominantStyle: string;
  cyclePhase: string;
  launchPotential: string;
  indicativePrice: string;
}> {
  if (!openai) throw new Error('AI not configured');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en mode.Donne les infos clés pour cette marque.
        Réponds uniquement en JSON :
      {
        "websiteUrl": "URL officielle",
        "signaturePiece": "Pièce emblématique actuelle",
        "dominantStyle": "Style principal",
        "cyclePhase": "emergent" | "croissance" | "pic" | "declin",
        "launchPotential": "opportunite" | "a_surveiller" | "sature",
        "indicativePrice": "Frange de prix (ex: 50-100€)"
      }`
      },
      { role: 'user', content: `Marque : ${brandName}` }
    ],
    response_format: { type: 'json_object' }
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty AI response');
  return JSON.parse(raw);
}

/**
 * Améliore un prompt de shooting photo pour atteindre un niveau de réalisme "Influencer Pro".
 * Prend en compte le sexe/genre du mannequin pour éviter les erreurs (ex: maquillage sur un homme si non souhaité).
 */
export async function enhanceShootingPrompt(options: {
  basePrompt: string;
  mannequinDescription?: string;
  brandStyle?: string;
  extraContext?: string;
}): Promise<string> {
  if (!openai) throw new Error('AI not configured');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an elite Director of Photography and Fashion Stylist AI.
Your goal is to transform basic user inputs into "Master Photography Scenarios" that yield ultra - realistic, editorial - grade images(Midjourney v6 / Higgsfield quality).

You must NOT just "clean up" the prompt.You must ARCHITECT it following this strict "MASTER STRUCTURE":

      1. ** SHOT & COMPOSITION **: Camera angle(e.g., Low - angle, Wide), Lens details(e.g., 85mm, Macro, Fisheye, iPhone 17 Pro Max), Framing(Center, Rule of thirds).
2. ** SUBJECT CLARITY **: Detailed mannequin description(skin texture, pose tension, expression), precise wardrobe fabrics(satin, heavy cotton, sheer).
3. ** SCENE & ATMOSPHERE **: "Thick" description of the environment(not just "a room", but "minimalist indoor corner with pale grey fabric walls"), Time of day, Weather(if outdoor).
4. ** LIGHTING MASTERY **: Specific setups(Diffused softbox, Cinematic rim light, Hard flash, Neon moody), Shadow quality(Sculpted, Harsh, Soft).
5. ** TECHNICAL SPECS **: Film grain(or lack thereof), Depth of field(bokeh quality), Texture realism(8k, pore details), Color grading(Monochrome, Vibrant, Pastel, Moody).

** CRITICAL RULES:**
- ** USER AUTHORITY **: The user's specific instructions (in CORE INPUTS or EXTRA INSTRUCTIONS) are NON-NEGOTIABLE. If they ask for "pink sky" or "holding a cat", YOU MUST INCLUDE IT. Do not overwrite explicit choices with generic style inferences.
      - ** Inference **: Use inference ONLY to fill gaps.If the user says "Gas Station", you infer the grit and lighting, UNLESS they specified "Clean white gas station".
- ** Realism **: Always force "Imperfect skin texture", "Natural proportions", "Cinematic lighting".
- ** Gender Safety **: Respet strictly the implied gender of the mannequin / subject.
- ** Output **: A single, dense, comma - separated paragraph rich in photography keywords.

** Example Input **: "woman, street, night, cool vibe"
      ** Example Output **: "Low-angle medium full shot, captured on 35mm film stock, slight grain. SUBJECT: Young woman leaning confidently against a brick wall, wearing oversized vintage leather jacket, relaxed posture, messy chic hair. SCENE: Wet London street at night, neon reflections on asphalt, steam rising from vents, blurred city lights background. LIGHTING: Cinematic street lighting, mixed temperature (blue ambient, orange sodium streetlamps), dramatic contrast. TECH: 8k resolution, ultra-realistic skin texture, moisture on skin, sharp focus on eyes, fashion editorial color grade."`,
      },
      {
        role: 'user',
        content: `TRANSFORM THIS SCENE into a Master Photography Prompt:
        
        ** CORE INPUTS **: "${options.basePrompt}"
      ** CONTEXT **:
    - Mannequin: ${options.mannequinDescription || 'Professional model (details inferred from context)'}
    - Brand Tone: ${options.brandStyle || 'High-end Fashion'}
    - Extra Instructions: ${options.extraContext || 'None'}

        Apply the "MASTER STRUCTURE".Make it visually stunning.`,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || options.basePrompt;
}

/**
 * Chat générique OpenAI (Joy, Johan, etc.)
 * Par défaut utilise gpt-4o-mini pour un maximum d'économies.
 */
export async function generateChat(
  system: string,
  messages: { role: 'user' | 'assistant', content: string }[],
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: 'gpt-4o' | 'gpt-4o-mini';
    image?: { url: string } | { base64: string, mimeType: string };
  } = {}
): Promise<string> {
  if (!openai) throw new Error('OpenAI non configuré');

  const formattedMessages: any[] = [
    { role: 'system', content: system },
    ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
  ];

  // Le dernier message peut contenir une image
  const lastMsg = messages[messages.length - 1];
  if (options.image) {
    const imageUrl = 'url' in options.image
      ? options.image.url
      : `data:${options.image.mimeType};base64,${options.image.base64}`;

    formattedMessages.push({
      role: 'user',
      content: [
        { type: 'text', text: lastMsg.content },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    });
  } else {
    formattedMessages.push({ role: lastMsg.role, content: lastMsg.content });
  }

  const completion = await openai.chat.completions.create({
    model: options.model || 'gpt-4o-mini',
    max_tokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    messages: formattedMessages,
  });

  return completion.choices[0]?.message?.content || '';
}
