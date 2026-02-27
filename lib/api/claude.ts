/**
 * Claude Sonnet 3.5 (Anthropic) — texte long et créatif.
 * Répartition : GPT-4o = vision + court, Claude = analyse longue, scripts, tech pack, etc.
 * Voir docs/llm-split.md.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface BrandAnalysisContext {
  signaturePiece?: string;
  dominantStyle?: string;
  cyclePhase?: string;
  launchPotential?: string;
  indicativePrice?: string;
  rank?: number;
  score?: string;
}

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

export interface TrendEnrichmentResult {
  advice: string;
  rating: number;
  imagePrompt: string;
}

export interface TrendsAnalysisInput {
  byCountry: Array<{ country: string | null; count: number }>;
  byStyle: Array<{ style: string | null; count: number }>;
  byProductType: Array<{ productType: string; count: number }>;
  topTrends?: Array<{ productName: string; productType: string; style: string | null; country: string | null; confirmationScore: number }>;
}

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function generateText(system: string, user: string, options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY non configurée');
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.6,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = response.content.find((b) => b.type === 'text');
  return (text && 'text' in text ? text.text : '').trim();
}

export async function generateChat(system: string, messages: { role: 'user' | 'assistant', content: string }[], options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY non configurée');
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    system,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });
  return (response.content[0] as unknown as { text: string }).text;
}

/** Résultat de l'analyse visuelle produit (identique à GPT-4o). */
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

/** Analyse visuelle d'un produit (image + titre) — Claude vision. */
export async function analyzeProductImage(
  imageUrl: string,
  title: string
): Promise<VisualTaggingResult> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY non configurée');
  const system = `Tu es un expert mode. Analyse l'image produit (e-commerce) et le titre fourni.
Réponds en JSON strict avec exactement ces champs:
- "cut": la coupe (ex: Boxy, Slim, Oversized, Regular, Wide Leg). Une seule valeur.
- "attributes": objet avec "materialVisible" (matière visible), "collarType" (type de col si visible), "colorExact" (couleur exacte).
- "trendScoreVisual": nombre entre 0 et 100, score de tendance basé sur la récurrence visuelle actuelle (100 = très tendance).
- "productSignature": une chaîne normalisée pour le matching multi-zones, ex: "veste-sans-manche_cargo" ou "hoodie_oversized_coton". Pas d'espaces, minuscules, tirets. Résume le type de vêtement + coupe + 1-2 attributs clés.
Réponds UNIQUEMENT par un objet JSON valide, sans markdown.`;
  const user = `Titre: "${title}"\n\nAnalyse cette image produit et renvoie cut, attributes, trendScoreVisual, productSignature.`;
  const text = await generateTextWithOptionalImage(system, user, {
    imageUrl: imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : undefined,
    maxTokens: 300,
    temperature: 0.3,
  });
  if (!text) throw new Error('Réponse Claude vide');
  let parsed: { cut?: string; attributes?: Record<string, string>; trendScoreVisual?: number; productSignature?: string };
  try {
    parsed = JSON.parse(text.replace(/^```json?\s*|\s*```$/g, '').trim()) as typeof parsed;
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu)');
  }
  const cut = typeof parsed.cut === 'string' ? parsed.cut.trim() : 'Regular';
  const attributes = parsed.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {};
  const trendScoreVisual = typeof parsed.trendScoreVisual === 'number'
    ? Math.min(100, Math.max(0, Math.round(parsed.trendScoreVisual)))
    : 50;
  const productSignature = typeof parsed.productSignature === 'string'
    ? parsed.productSignature.replace(/\s+/g, '-').toLowerCase().slice(0, 120)
    : `${cut}-${Object.values(attributes).filter(Boolean).join('-')}`.replace(/\s+/g, '-').toLowerCase().slice(0, 120);
  return { cut, attributes, trendScoreVisual, productSignature: productSignature || 'unknown' };
}

/** Récupère une image en base64 (pour envoi à Claude). Retourne null si échec. */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const m = url.match(/^data:([^;]+);base64,(.+)$/);
      if (m) {
        const mediaType = m[1].includes('png') ? 'image/png' : m[1].includes('gif') ? 'image/gif' : m[1].includes('webp') ? 'image/webp' : 'image/jpeg';
        return { data: m[2], mediaType };
      }
    }
    const res = await fetch(url, { headers: { 'User-Agent': 'MediaBiangory/1.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const base64 = buf.toString('base64');
    const ct = res.headers.get('content-type') || '';
    const mediaType = ct.includes('png') ? 'image/png' : ct.includes('gif') ? 'image/gif' : ct.includes('webp') ? 'image/webp' : 'image/jpeg';
    return { data: base64, mediaType };
  } catch {
    return null;
  }
}

/** Génère du texte avec option d’envoyer une image (vision). */
async function generateTextWithOptionalImage(
  system: string,
  userText: string,
  options: { imageUrl?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY non configurée');
  let content: string | Anthropic.MessageParam['content'] = userText;
  if (options.imageUrl) {
    const img = await fetchImageAsBase64(options.imageUrl);
    if (img) {
      content = [
        { type: 'image' as const, source: { type: 'base64' as const, media_type: img.mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', data: img.data } },
        { type: 'text' as const, text: userText },
      ];
    }
  }
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.6,
    system,
    messages: [{ role: 'user', content }],
  });
  const text = response.content.find((b) => b.type === 'text');
  return (text && 'text' in text ? text.text : '').trim();
}

/** Scripts UGC — Claude (créatif). */
export async function generateUGCScripts(
  brandName: string,
  productDescription: string,
  count: number = 5,
  tone: string = 'décontracté',
  brandIdentity?: { colorPalette?: unknown; typography?: unknown; styleGuide?: unknown }
): Promise<string[]> {
  let identityContext = '';
  if (brandIdentity?.colorPalette) {
    const colors = typeof brandIdentity.colorPalette === 'object' && brandIdentity.colorPalette
      ? Object.entries(brandIdentity.colorPalette as object).map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    if (colors) identityContext += `Couleurs de la marque : ${colors}. `;
  }
  if (brandIdentity?.styleGuide) {
    identityContext += `Style guide : ${JSON.stringify(brandIdentity.styleGuide)}. `;
  }
  const toneMap: Record<string, string> = {
    décontracté: 'Ton décontracté, authentique, proche des jeunes',
    professionnel: 'Ton professionnel et élégant',
    streetwear: 'Ton streetwear, urbain, cool',
    luxe: 'Ton luxe, premium, sophistiqué',
    fun: 'Ton fun, énergique, positif',
  };
  const system = `Tu es un expert en création de scripts UGC viraux pour marques de mode.
Crée des scripts de 15 secondes : Problème → Solution → Preuve → CTA.
Engageants, authentiques, adaptés à TikTok/Instagram.
${toneMap[tone] ?? toneMap.décontracté}.`;
  const scripts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await generateText(
      system,
      `Génère un script UGC viral pour la marque ${brandName}. ${identityContext}Produit : ${productDescription}. En français, captivant, hooks viraux du moment.`,
      { maxTokens: 200, temperature: 0.8 }
    );
    if (text) scripts.push(text);
  }
  return scripts;
}

/** Tech pack — Claude (structuré). */
export async function generateTechPack(designData: {
  type: string;
  cut: string;
  details: object;
  material: string;
}): Promise<object> {
  const system = `Tu es un expert en tech packs de mode. Génère un tech pack professionnel au format JSON avec tous les composants nécessaires (tissuPrincipal, bordCote, etiquettes, boutons, fermetures, etc.). Réponds UNIQUEMENT par un objet JSON valide.`;
  const user = `Génère un tech pack pour : Type ${designData.type}, Coupe ${designData.cut}, Détails ${JSON.stringify(designData.details)}, Matière ${designData.material}.`;
  const text = await generateText(system, user, { maxTokens: 800, temperature: 0.3 });
  try {
    return JSON.parse(text) as object;
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu)');
  }
}

/** Tech pack ultra détaillé — Claude. */
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
  const questionnaire = input.mockupSpec || {};
  const context = [
    `Type: ${input.type}`,
    `Coupe: ${input.cut}`,
    `Matière: ${input.material}`,
    questionnaire ? `Détails: ${JSON.stringify(questionnaire)}` : '',
  ].filter(Boolean).join('\n');
  const system = `Tu es un expert en tech packs mode. Génère un tech pack ULTRA DÉTAILLÉ au format JSON pour fournisseur.
Réponds UNIQUEMENT par un objet JSON valide avec : materials (array), measurementsTable (array { size, measurements } en cm), trims (array), constructionNotes (string), printSpec (object si impression), labeling, packaging, compliance.`;
  const user = `Génère le tech pack ultra détaillé pour:\n${context}`;
  const text = await generateText(system, user, { maxTokens: 1200, temperature: 0.3 });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu)');
  }
}

export interface QuoteEmailInput {
  design: { type: string; cut?: string | null; material?: string | null; techPack?: unknown };
  factory: { name: string; country: string };
  brandName: string;
  useEnglish: boolean;
}

export interface QuoteEmailResult {
  subject: string;
  body: string;
}

/** Email demande de devis pour fournisseur — généré par l'IA à partir du tech pack. */
export async function generateQuoteEmail(input: QuoteEmailInput): Promise<QuoteEmailResult> {
  const lang = input.useEnglish ? 'anglais' : 'français';
  const techPackSummary = input.design.techPack && typeof input.design.techPack === 'object'
    ? JSON.stringify(input.design.techPack).slice(0, 1500)
    : 'Non fourni';
  const system = `Tu es un expert en sourcing mode. Génère un email professionnel de demande de devis pour un fournisseur.
Réponds UNIQUEMENT au format JSON avec exactement deux clés : "subject" (sujet de l'email) et "body" (corps du message).
Le sujet doit être court et descriptif. Le corps doit inclure : salutation, présentation de la marque, description du produit (type, coupe, matière), référence au tech pack, demande de prix unitaire, délai, MOQ, échantillons. Termine par une formule de politesse et la signature [Votre Nom / Marque].`;
  const user = `Génère l'email en ${lang}.

Marque : ${input.brandName}
Fournisseur : ${input.factory.name} (${input.factory.country})
Produit : ${input.design.type}${input.design.cut ? `, coupe ${input.design.cut}` : ''}${input.design.material ? `, matière ${input.design.material}` : ''}

Résumé du tech pack :
${techPackSummary}

Rédige un email professionnel de demande de devis. Format JSON : {"subject":"...","body":"..."}`;
  const text = await generateText(system, user, { maxTokens: 800, temperature: 0.4 });
  try {
    const parsed = JSON.parse(text) as { subject?: string; body?: string };
    return {
      subject: parsed.subject || (input.useEnglish ? 'Quote request' : 'Demande de devis'),
      body: parsed.body || '',
    };
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu)');
  }
}

/** Contexte pour description produit (marque + stratégie + identité). */
export interface ProductDescriptionContext {
  brandName: string;
  styleGuide?: { story?: string; preferredStyle?: string; positioning?: string; targetAudience?: string; productType?: string; tagline?: string; description?: string } | null;
  phase1Data?: { productType?: string; weight?: string } | null;
  phaseSummaries?: Record<string, string> | null;
  designType: string;
  designCut?: string | null;
  designMaterial?: string | null;
  techPackSummary?: string | null;
}

/** Description produit e-commerce à partir de la marque, stratégie et identité. */
export async function generateProductDescriptionFromBrand(context: ProductDescriptionContext): Promise<string> {
  const parts: string[] = [
    `Marque : ${context.brandName}.`,
    context.styleGuide?.story ? `Histoire / raison d'être de la marque (donner du sens, âme) : ${context.styleGuide.story}.` : '',
    context.styleGuide?.preferredStyle ? `Style / positionnement : ${context.styleGuide.preferredStyle}.` : '',
    context.styleGuide?.targetAudience ? `Cible : ${context.styleGuide.targetAudience}.` : '',
    context.phase1Data?.productType ? `Type produit : ${context.phase1Data.productType}.` : '',
    context.phase1Data?.weight ? `Grammage : ${context.phase1Data.weight}.` : '',
    context.phaseSummaries && Object.keys(context.phaseSummaries).length > 0
      ? `Résumés phases : ${JSON.stringify(context.phaseSummaries)}.`
      : '',
    `Design : ${context.designType}${context.designCut ? `, coupe ${context.designCut}` : ''}${context.designMaterial ? `, ${context.designMaterial}` : ''}.`,
    context.techPackSummary ? `Tech pack : ${context.techPackSummary}.` : '',
  ].filter(Boolean);

  const system = `Tu es un rédacteur e-commerce mode. Tu rédiges des descriptions produit courtes, engageantes et alignées avec l'identité de la marque. Ton français est fluide et sans faute. Réponds UNIQUEMENT par le texte de la description, sans préambule.`;
  const user = `Contexte marque et produit :\n${parts.join('\n')}\n\nRédige une description produit e-commerce en français (2 à 4 phrases), vendeuse et alignée avec l'identité de la marque. Si une histoire ou raison d'être de la marque est fournie, donne du sens et de l'âme à la description pour que les gens s'y retrouvent. Mets en valeur le produit (${context.designType}), les matières/coupe si connus, et le positionnement. Pas de titre, uniquement le paragraphe de description.`;
  const text = await generateText(system, user, { maxTokens: 400, temperature: 0.6 });
  if (!text) throw new Error('Aucune description générée');
  return text;
}

/** Amélioration de prompt — Claude. */
export async function enhancePrompt(userInput: string, context: { type: string; style: string }): Promise<string> {
  const system = `Tu es un assistant pour créer des prompts optimaux pour génération d'images de mode. Améliore les prompts utilisateurs pour obtenir de meilleurs résultats.`;
  const user = `Améliore ce prompt pour génération d'image de mode : "${userInput}"\nContexte : Type ${context.type}, Style ${context.style}. Le prompt doit être détaillé, précis et optimisé pour génération IA.`;
  const text = await generateText(system, user, { maxTokens: 200, temperature: 0.5 });
  return text || userInput;
}

/** Analyse tendances — Claude (texte long). */
export async function generateTrendsAnalysis(data: TrendsAnalysisInput): Promise<string> {
  const summary = [
    'Statistiques par pays: ' + (data.byCountry?.map((s) => `${s.country || '—'}: ${s.count}`).join(', ') || 'aucune'),
    'Statistiques par style: ' + (data.byStyle?.map((s) => `${s.style || '—'}: ${s.count}`).join(', ') || 'aucune'),
    'Statistiques par type de produit: ' + (data.byProductType?.map((s) => `${s.productType}: ${s.count}`).join(', ') || 'aucune'),
  ].join('\n');
  const topTrendsText = data.topTrends?.length
    ? 'Tendances principales: ' + data.topTrends.slice(0, 15).map((t) => `${t.productName} (${t.productType}${t.style ? `, ${t.style}` : ''}${t.country ? `, ${t.country}` : ''}, score ${t.confirmationScore})`).join(' ; ')
    : '';
  const system = `Tu es un expert en tendances mode et retail en France et en Europe.
Tu analyses des données de tendances et tu rédiges des analyses courtes, structurées et actionnables.
Réponds en français. Inclus : 1) Les tendances à venir en France. 2) Des prévisions à 6–12 mois (styles, coupes, catégories). 3) Des recommandations concrètes pour les marques et créateurs.`;
  const user = `À partir des données suivantes, rédige une analyse approfondie des tendances (prévisions France, tendances à venir, recommandations).\n\n${summary}\n${topTrendsText ? '\n' + topTrendsText : ''}`;
  const text = await generateText(system, user, { maxTokens: 1200, temperature: 0.6 });
  return text || 'Aucune analyse générée.';
}

/** Analyse produit individuel — Claude. */
export async function generateProductTrendAnalysis(product: {
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
}): Promise<string> {
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
  const system = `Tu es Outfity Intelligence, l'algorithme de détection de signaux faibles et de viralité sociale leader du marché.
Ton rôle est d'analyser un vêtement et de valider son potentiel commercial en le corrélant avec les flux de données mondiaux (réseaux sociaux, TikTok, signaux de production mass-market).

Pour chaque produit, tu dois :
1. Déterminer son IVS (Indice de Viralité Sociale) sur 100 avec précision (utilise des décimales pour la crédibilité).
2. Identifier l'esthétique sociale exacte (ex: Clean Girl, Gorpcore, Y2K v2, quiet luxury).
3. Analyser la "Raison d'Achat Impulsive" : pourquoi ce produit va-t-il buzzer ?
4. Prédire la "Market Opportunity" : est-ce le bon moment pour lancer ce design ?

Sois analytique, précis et professionnel. Évite les termes vagues. Parle comme une IA de Data Science.`;
  const user = `Analyse ce produit et donne son IVS, son esthétique sociale, sa raison d'achat impulsive et sa market opportunity.\n\n${desc}`;
  const text = await generateText(system, user, { maxTokens: 600, temperature: 0.6 });
  return text || 'Aucune analyse générée.';
}

/** Prompt pour image produit — Claude. */
export async function generateProductImagePrompt(product: {
  productName: string;
  productType: string;
  cut?: string | null;
  material?: string | null;
  color?: string | null;
  style?: string | null;
}): Promise<string> {
  const desc = [product.productName, product.productType, product.cut ?? '', product.material ?? '', product.color ?? '', product.style ?? ''].filter(Boolean).join(', ');
  const system = `Tu es un expert en visuels mode. Tu génères un prompt court en anglais pour une IA de génération d'image (type FLUX / DALL-E). Le prompt doit décrire UNE PHOTO DE PRODUIT MODE : vêtement ou accessoire, sur mannequin ou flat lay, fond neutre, lumière professionnelle, style e-commerce. Réponds UNIQUEMENT par le prompt, sans phrase d'intro. 1 à 2 lignes max. Exemple: "Professional product photography of a [type] [cut] [material], [color], [style], on white background, studio lighting, 8k".`;
  const user = `Génère un prompt pour une image produit : ${desc}`;
  const text = await generateText(system, user, { maxTokens: 150, temperature: 0.5 });
  if (!text) throw new Error('Aucun prompt généré');
  return text;
}

/** Contexte pour générer un prompt Ideogram de design vêtement (un emplacement). */
export interface GarmentDesignPromptContext {
  brand_name: string;
  inspiration_brand?: string;
  target_audience?: string;
  positioning_style?: string;
  preferred_style?: string;
  visual_identity?: {
    colorPalette?: { primary?: string; secondary?: string; accent?: string };
    typography?: { heading?: string; body?: string };
  };
  placement: string;
  text_for_this_placement: string;
  garment_color_hex?: string;
  design_style_keywords?: string;
  design_avoid?: string;
  /** Inspiration / "ce que j'aimerais" saisi par l'utilisateur */
  design_inspiration?: string;
  /** Mots-clés techniques dérivés de la marque d'inspiration (style mapper) — à intégrer dans le prompt Ideogram */
  technical_style_keywords?: string;
}

/** Résultat de la génération de prompt design vêtement : prompt Ideogram + option avec/sans personnage/scène. */
export interface GarmentDesignPromptResult {
  prompt: string;
  /** Si true, l'image peut montrer un visage, une figure ou une scène en style illustration/design (pas photo) — Ideogram sera appelé sans fond transparent (ex. 3:4). */
  includePerson: boolean;
}

/** Génère un prompt Ideogram pour un design vêtement à partir du contexte marque + identité + inspiration. */
export async function generateGarmentDesignPrompt(context: GarmentDesignPromptContext): Promise<GarmentDesignPromptResult> {
  const parts: (string | null)[] = [
    `Marque : ${context.brand_name}`,
    context.inspiration_brand ? `Marque d'inspiration : ${context.inspiration_brand}` : null,
    context.technical_style_keywords ? `Technical style keywords (use in Ideogram prompt) : ${context.technical_style_keywords}` : null,
    context.target_audience ? `Cible (à intégrer dans le design) : ${context.target_audience}` : null,
    context.positioning_style ? `Stratégie / positionnement (à refléter dans le design) : ${context.positioning_style}` : null,
    context.preferred_style ? `Style préféré : ${context.preferred_style}` : null,
    `Texte OBLIGATOIRE à afficher (aucun autre mot) : "${context.text_for_this_placement}"`,
    context.garment_color_hex ? `Couleur du vêtement (contraste) : ${context.garment_color_hex}` : null,
    context.design_style_keywords ? `Mots-clés style : ${context.design_style_keywords}` : null,
    context.design_avoid ? `À éviter : ${context.design_avoid}` : null,
    context.design_inspiration ? `Ce que le client aimerait / inspiration : ${context.design_inspiration}` : null,
  ];
  if (context.visual_identity?.colorPalette) {
    const c = context.visual_identity.colorPalette;
    parts.push(`Palette : primary ${c.primary ?? ''}, secondary ${c.secondary ?? ''}, accent ${c.accent ?? ''}`);
  }
  if (context.visual_identity?.typography) {
    const t = context.visual_identity.typography;
    parts.push(`Typo : heading ${t.heading ?? ''}, body ${t.body ?? ''}`);
  }
  const userContext = parts.filter(Boolean).join('\n');

  const system = `ACT AS: Creative Director specialized in Clothing Brand Assets.

Your task is to generate a single prompt in ENGLISH for Ideogram to create a STANDALONE GRAPHIC ASSET for print (t-shirt, merch). Use the following process:

1. ANALYSE: Use the "Technical style keywords" provided when present (they come from the inspiration brand style mapper). Otherwise, based on the Inspiration brand and positioning/strategy, identify the core design language. Examples: Corteiz → Brutalist, urban, bold; Nike → sleek, minimalist, athletic; Arc'teryx → technical, topographic, gorpcore; Jacquemus → Parisian, airy, organic. Derive 2–4 precise style keywords and integrate them into the [Graphic description] part of the prompt.

2. DESIGN TYPE: The output must be a prompt for a STANDALONE GRAPHIC ASSET only — no scene, no character, no product mockup.

3. STIPULATION (mandatory in the prompt you generate):
   - Forbid: decorative background, shadows, humans, figures, clothing textures, gradients, mockups, extra text.
   - Require: flat 2D vector-style design on a solid white background. Isolated graphic only.

Prompt structure to follow (fill the bracketed part from your analysis):
"A flat 2D graphic asset for a [brand type, e.g. streetwear/tailoring] brand, isolated on a solid white background. [Graphic description inspired by the inspiration brand and strategy: shapes, mood, typography style, contrast]. The typography must be bold and central, featuring the text \"{{USER_TEXT}}\" exactly as given — no other words. Style: [strategy/positioning], high-contrast, screen-print ready, minimalist industrial aesthetic. No gradients, no mockups, no extra text, no shadows, no people, no clothing texture."

RULES:
- The ONLY words visible in the image must be the exact text provided by the user (preserve accents, case). No other words.
- "includePerson" must always be false (standalone graphic only, no humans).

Respond ONLY with a valid JSON object with exactly 2 fields:
- "prompt": the full Ideogram prompt in English (use the structure above; replace {{USER_TEXT}} with the actual user text).
- "includePerson": false
No markdown, no surrounding text.`;

  const user = `DATA FROM DATABASE:
${userContext}

GENERATE PROMPT FOR IDEOGRAM (Creative Director method: ANALYSE inspiration/strategy → DESIGN TYPE standalone graphic → STIPULATION flat 2D on solid white, no shadows, no humans, no clothing textures).`;
  const text = await generateText(system, user, { maxTokens: 500, temperature: 0.7 });
  if (!text) throw new Error('Aucun prompt design vêtement généré');
  let parsed: { prompt?: string; includePerson?: boolean };
  try {
    const cleaned = text.replace(/^```\w*\n?|\n?```$/g, '').trim();
    parsed = JSON.parse(cleaned) as { prompt?: string; includePerson?: boolean };
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu pour design vêtement)');
  }
  const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';
  if (!prompt) throw new Error('Prompt design vêtement vide');
  return {
    prompt,
    includePerson: parsed.includePerson === true,
  };
}

/** Conseils tendance + note + prompt image — Claude. */
export async function generateTrendAdviceAndImagePrompt(product: TrendEnrichmentInput): Promise<TrendEnrichmentResult> {
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
  const system = `Tu es un expert en tendances mode et retail en France. À partir des infos d'un produit détecté chez plusieurs marques, réponds en JSON strict avec exactement 3 champs :
- "advice" : 2 à 4 phrases en français. Conseils sur la tendance : est-ce une bonne tendance à suivre ou à éviter, pourquoi, recommandations concrètes (cible, prix, positionnement).
- "rating" : un nombre entier entre 1 et 10 (10 = tendance très forte à suivre, 1 = à éviter).
- "imagePrompt" : une seule phrase en anglais pour générer une photo produit e-commerce (vêtement sur fond neutre, lumière pro, style catalogue).
Réponds UNIQUEMENT par un objet JSON valide, sans markdown ni texte autour.`;
  const user = `Analyse cette tendance et renvoie advice, rating et imagePrompt.\n\n${desc}`;
  const text = await generateText(system, user, { maxTokens: 400, temperature: 0.5 });
  if (!text) throw new Error('Réponse Claude vide');
  let parsed: { advice?: string; rating?: number; imagePrompt?: string };
  try {
    parsed = JSON.parse(text) as { advice?: string; rating?: number; imagePrompt?: string };
  } catch {
    throw new Error('Réponse Claude invalide (JSON attendu)');
  }
  const advice = typeof parsed.advice === 'string' ? parsed.advice.trim() : '';
  const rating = typeof parsed.rating === 'number' ? Math.min(10, Math.max(1, Math.round(parsed.rating))) : 5;
  const imagePrompt = typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt.trim() : '';
  if (!advice || !imagePrompt) throw new Error('Réponse Claude incomplète (advice et imagePrompt requis)');
  return { advice, rating, imagePrompt };
}

/** Analyse de marque — Claude (texte long). Orientée "répliquer la stratégie" : positionnement, cible, canaux, messages clés, pricing, timing. */
export async function generateBrandAnalysis(brandName: string, context?: BrandAnalysisContext): Promise<string> {
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
    if (parts.length > 0) contextStr = `\n\nContexte tendances EU :\n${parts.join('\n')}`;
  }
  const system = `Tu es un expert en stratégie mode et retail, spécialisé dans l'accompagnement des jeunes créateurs qui veulent s'inspirer des grandes marques pour lancer la leur.
Tu rédiges des analyses de marque COMPLÈTES et ACTIONNABLES, avec la même structure que la stratégie marketing dans "gérer ma marque".
Chaque section doit donner des éléments directement réutilisables par un créateur pour construire sa propre stratégie. Structure avec des titres ##. Réponds UNIQUEMENT en français. Sois concret, factuel et orienté action. Interdit le gras markdown (**). Interdit les hashtags bruts (#xxx) : reformule en "thèmes : …" ou en mots simples.`;
  const user = `Analyse la marque "${brandName}" et rédige une analyse complète pour un créateur qui veut DUPLIQUER ou s'inspirer de sa stratégie pour lancer sa marque.${contextStr}

Structure obligatoire (identique à la stratégie marketing dans "gérer ma marque") — tu DOIS rédiger les 7 sections ci-dessous, sans en omettre aucune. Chaque section avec un titre ## puis des paragraphes fluides :

## 1. Vision et positionnement
Positionnement de la marque, codes, promesse, identité. Comment un créateur peut s'en inspirer ou s'en différencier clairement.

## 2. Cible et client idéal
Profil précis (âge, aspirations, habitudes). Où les trouver (canaux, communautés). Comment les décrire pour sa propre marque.

## 3. Offre et pricing
Fourchettes de prix, structure de gamme, promotions. Recommandations pour un créateur (prix d'entrée, positionnement prix).

## 4. Canaux et marketing
Canaux utilisés (Instagram, TikTok, retail, influence, événements), type de contenu, tonalité. Ce qui marche pour eux et comment le transposer à plus petit budget.

## 5. Messages clés et storytelling
Thèmes récurrents, angles de communication, codes. Formulations à adapter pour une nouvelle marque.

## 6. Stratégie de contenu
Ce que publie cette marque, la fréquence, les thèmes qu'elle aborde. Et comment s'en inspirer.

## 7. Site internet
Étude approfondie du site e-commerce de cette marque — ce qui fonctionne (structure monoproduit, UX/UI, éléments de réassurance, visuels, conversion), cohérence avec le positionnement.
DONNÉES TECHNIQUES POUR RÉPLIQUER :
- Palette de couleurs : Liste les codes HEX exacts (#RRGGBB) du site.
- Architecture : Liste les sections clés de la Landing Page (ex: Hero avec vidéo, Grille de bénéfices, Section Preuve Sociale).
- Typographie : Identifie les styles de polices (Serif, Sans-serif, Bold).
- Recommandations pour un créateur : structure de conversion, CTA, et obligation d'inclure la mention de confiance "Partenaire Officiel Outfity" avec logo dans le footer.`;
  let text = await generateText(system, user, { maxTokens: 3000, temperature: 0.7 });
  if (!text) return 'Aucune analyse générée.';
  if (!/##\s*7\.\s*Site\s*internet/i.test(text)) {
    text = text.trimEnd() + '\n\n## 7. Site internet\nRecommandations pour le site e-commerce : structure claire, page produit avec visuels et description alignés sur la marque, confiance (avis, retours), CTA visibles, expérience mobile fluide. Un site mono-produit ou petite gamme doit mettre en avant l\'histoire de la marque et la qualité du produit pour convertir.';
  }
  return text;
}

export interface BrandStrategyForCreatorInput {
  templateBrandName: string;
  creatorBrandName: string;
  analysisText?: string;
  budget?: string;
  positioning?: string;
  targetAudience?: string;
  /** Contexte enrichi de la marque du créateur (style, domaine, réseaux) pour croiser avec la marque template. */
  creatorBrandContext?: string;
  /** "Pourquoi avez-vous créé votre marque ?" (Identité) — fondation pour personnaliser toute la stratégie. */
  creatorStory?: string;
}

/** Génère un plan stratégique personnalisé pour un créateur, inspiré d'une grande marque. */
export async function generateBrandStrategyForCreator(input: BrandStrategyForCreatorInput): Promise<string> {
  const {
    templateBrandName,
    creatorBrandName,
    analysisText = '',
    budget,
    positioning,
    targetAudience,
    creatorBrandContext,
    creatorStory,
  } = input;

  const extraContext: string[] = [];
  if (creatorStory?.trim()) {
    extraContext.push(`Pourquoi le créateur a créé sa marque (histoire, raison d'être) — FONDATION : toute la stratégie doit en être le reflet et rester cohérente avec cette histoire :\n${creatorStory.trim()}`);
  }
  if (creatorBrandContext?.trim()) extraContext.push(`Profil marque du créateur (SOURCE UNIQUE pour personnaliser le plan — ne rien inventer en dehors de ça) :\n${creatorBrandContext.trim()}`);
  if (budget?.trim()) extraContext.push(`Budget indicatif : ${budget.trim()}`);
  if (positioning?.trim()) extraContext.push(`Positionnement souhaité : ${positioning.trim()}`);
  if (targetAudience?.trim()) extraContext.push(`Cible visée : ${targetAudience.trim()}`);
  const contextBlock =
    extraContext.length > 0
      ? `\n\nDonnées du créateur (à utiliser telles quelles, sans inventer) :\n${extraContext.join('\n')}`
      : '';

  const system = `Tu es un expert en stratégie mode et retail. Tu rédiges un plan stratégique comme si tu le présentais à ton boss : ton naturel, fluide, professionnel, sans jargon IA.
RÈGLES STRICTES :
1. La marque du créateur n'existe pas encore (ou est confidentielle). Tu ne dois JAMAIS chercher d'informations sur elle ni inventer des faits à partir de son nom. Tu te bases UNIQUEMENT sur le "Profil marque du créateur" et surtout sur le "Pourquoi le créateur a créé sa marque" quand il est fourni. Si une info n'y figure pas, tu la déduis du contexte ou tu restes général.
2. Quand le "Pourquoi le créateur a créé sa marque" (son histoire, sa raison d'être) est fourni : utilise-le comme FONDATION. La vision, la cible, les messages clés, le storytelling et la stratégie de contenu doivent en être le reflet direct — la stratégie doit donner l'impression d'être vraiment la sienne, personnalisée à son histoire.
3. Tu peux utiliser le nom de la marque uniquement comme libellé dans le texte (ex. "Pour [Nom], nous recommandons...") mais jamais pour en déduire des caractéristiques.
4. Rédaction : paragraphes fluides, comme un document de conseil. Interdit d'utiliser le gras markdown (**). Interdit les listes à puces excessives. Tu peux utiliser des titres de section (## 1. Vision...) puis du texte en paragraphes. Le résultat doit sembler rédigé par un humain expert, pas par une IA. Réponds UNIQUEMENT en français.`;

  const analysisSection = analysisText.trim()
    ? `\n\n--- Analyse de la marque template "${templateBrandName}" (référence) ---\n\n${analysisText.trim()}\n\n--- Fin de l'analyse ---\n\n`
    : '';

  const user = `Marque template (inspiration) : "${templateBrandName}".
Libellé de la marque du créateur (à afficher dans le document uniquement, ne pas en déduire d'infos) : "${creatorBrandName}".${analysisSection}
Rédige un plan stratégique complet, comme une présentation pour un boss. Base-toi UNIQUEMENT sur le profil créateur fourni ci-dessous pour personnaliser (positionnement, cible, story, etc.). N'invente rien à partir du nom "${creatorBrandName}".${contextBlock}

Structure obligatoire : tu DOIS rédiger les 7 sections ci-dessous, sans en omettre aucune. Chaque section avec un titre ## puis des paragraphes (pas de ** ni de listes interminables) :

## 1. Vision et positionnement
Un ou deux paragraphes : comment positionner la marque en s'inspirant de ${templateBrandName} (différenciation, promesse, identité). Ton naturel.

## 2. Cible et client idéal
Paragraphe(s) : profil de la cible, où les trouver (canaux, communautés). Fluide.

## 3. Offre et pricing
Paragraphe(s) : structure de gamme, fourchettes de prix, première collection ou pièces d'entrée.

## 4. Canaux et marketing
Paragraphe(s) : canaux prioritaires, type de contenu. Rédigé.

## 5. Messages clés et storytelling
Paragraphe(s) : thèmes, angles, ton. Pas de listes à puces longues.

## 6. Stratégie de contenu
Paragraphes détaillés : Piliers de contenu, idées de publications (TikTok, Instagram), formats vidéos et direction artistique pour les réseaux sociaux. 

## 7. Site internet
Paragraphes détaillés : étude du site e-commerce / guidelines pour un bon site qui convertit.
Cette section doit inclure des ÉLÉMENTS TECHNIQUES concrets :
- Palette de couleurs HEX (ex: '#1a1a1a', '#ffffff') inspirée de la marque template.
- Structure de la Landing Page (sections recommandées dans l'ordre, ex: Hero, Avantages, Produit Focus).
- Recommandation Thème : Explique pourquoi le thème Dawn (gratuit) est idéal et comment le configurer.
- Marquage de confiance : Obligation d'ajouter la mention "Partenaire Officiel Outfity" avec logo dans le footer pour renforcer la légitimité du site.
- Conversion : Guidelines UX/UI (arrondis des boutons, espacements airy) pour un rendu haut de gamme.`;

  let text = await generateText(system, user, { maxTokens: 4000, temperature: 0.7 });
  if (!text) return 'Aucune stratégie générée.';
  if (!/##\s*6\.\s*Site\s*internet/i.test(text)) {
    text = text.trimEnd() + '\n\n## 6. Site internet\nRecommandations pour le site e-commerce : structure claire, page produit avec visuels et description alignés sur la marque, confiance (avis, retours), CTA visibles, expérience mobile fluide. Un site mono-produit ou petite gamme doit mettre en avant l\'histoire de la marque et la qualité du produit pour convertir.';
  }
  return text;
}

/** Génère le plan stratégique de la marque de référence elle-même (template partagé, non personnalisé créateur). */
export async function generateBrandStrategyTemplate(
  templateBrandName: string,
  analysisText: string
): Promise<string> {
  const analysisSection = analysisText.trim()
    ? `\n\n--- Analyse de la marque ---\n\n${analysisText.trim()}\n\n--- Fin de l'analyse ---\n\n`
    : '';

  const system = `Tu es un expert en stratégie mode et retail. Tu rédiges un plan stratégique comme si tu le présentais à ton boss : ton naturel, fluide, professionnel, sans jargon IA.
RÈGLES : Rédaction en paragraphes fluides. Interdit le gras markdown (**). Interdit les listes à puces excessives. Interdit d'écrire des hashtags bruts (#xxx) dans le texte : reformule en "thèmes ou codes : X, Y, Z" ou en mots simples. Titres de section (## 1. Vision...) puis paragraphes. Réponds UNIQUEMENT en français.`;

  const user = `Marque : "${templateBrandName}".${analysisSection}
Rédige un plan stratégique complet **pour cette marque** (pas pour une autre) : comment elle se positionne, sa cible, son offre, ses canaux, ses messages, son plan d'action, sa stratégie de contenu. Base-toi UNIQUEMENT sur l'analyse fournie. Si une info manque, reste général et cohérent.

Structure obligatoire (titres ## puis paragraphes) :
## 1. Vision et positionnement
Un ou deux paragraphes : positionnement de la marque, promesse, identité.

## 2. Cible et client idéal
Paragraphe(s) : profil de la cible, où les trouver.

## 3. Offre et pricing
Paragraphe(s) : structure de gamme, fourchettes de prix.

## 4. Canaux et marketing
Paragraphe(s) : canaux prioritaires, type de contenu.

## 5. Messages clés et storytelling
Paragraphe(s) : thèmes, angles, ton. Ne pas écrire de hashtags (#xxx) : utiliser "thèmes : …" ou "codes : …".

## 6. Site internet
Paragraphes : étude du site e-commerce de cette marque — ce qui fonctionne (structure, UX, confiance, visuels, conversion), cohérence avec le positionnement.
Inclus impérativement :
- Couleurs HEX dominantes identifiées.
- Structure de la page produit mono-produit idéale.
- Éléments de design clés (boutons, espacements).
- Conseil pour le créateur : marquage "Partenaire Officiel Outfity" requis pour le branding.`;

  const text = await generateText(system, user, { maxTokens: 3600, temperature: 0.7 });
  return text || 'Aucune stratégie générée.';
}

/** Identité visuelle recommandée pour une marque (couleurs hex + polices + explication logo). */
export interface VisualIdentityRecommendation {
  colorPalette: { primary?: string; secondary?: string; accent?: string };
  typography: { heading?: string; body?: string };
  /** Explication du choix du logo et de l'identité visuelle (pour affichage marque de référence). */
  logoRationale?: string;
}

/** Génère une recommandation d'identité visuelle (couleurs, polices, explication logo) à partir du nom de marque et de l'analyse. */
export async function generateVisualIdentityFromBrand(
  brandName: string,
  analysisText: string
): Promise<VisualIdentityRecommendation> {
  const analysisSection = analysisText.trim()
    ? `\n\n--- Analyse de la marque ---\n${analysisText.slice(0, 3000)}\n---\n\n`
    : '';

  const system = `Tu es un expert en identité de marque et design. Tu proposes une identité visuelle cohérente pour une marque à partir de son nom et de son analyse.
Retourne UNIQUEMENT un objet JSON valide, sans markdown ni texte autour, avec exactement ces clés :
- colorPalette (objet) : { primary (string hex #RRGGBB), secondary (string hex), accent (string hex) } — 3 couleurs cohérentes avec l'univers de la marque (mode, luxe, streetwear, etc.)
- typography (objet) : { heading (string nom de police, ex. "Helvetica Neue", "Playfair Display"), body (string nom de police, ex. "Inter", "Open Sans") } — polices adaptées au positionnement
- logoRationale (string) : 2 à 4 phrases expliquant pourquoi cette identité visuelle (logo, couleurs, typo) correspond à la marque et ce qu'elle communique. Ton professionnel, en français.`;

  const user = `Marque : "${brandName}".${analysisSection}
Propose une identité visuelle (3 couleurs hex + 2 polices + logoRationale) cohérente avec cette marque. Le logoRationale doit expliquer pourquoi ce choix d'identité (logo, couleurs, polices) reflète la marque. Réponds uniquement par le JSON.`;

  const text = await generateText(system, user, { maxTokens: 500, temperature: 0.5 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as Record<string, unknown>;
    const cp = data.colorPalette && typeof data.colorPalette === 'object' ? (data.colorPalette as Record<string, string>) : {};
    const ty = data.typography && typeof data.typography === 'object' ? (data.typography as Record<string, string>) : {};
    const toHex = (s: string) => (/^#[0-9A-Fa-f]{6}$/.test(s) ? s : `#${(s.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6) || '000000').padEnd(6, '0')}`);
    const logoRationale = typeof data.logoRationale === 'string' && data.logoRationale.trim() ? data.logoRationale.trim() : undefined;
    return {
      colorPalette: {
        primary: typeof cp.primary === 'string' && cp.primary ? toHex(cp.primary) : '#1a1a1a',
        secondary: typeof cp.secondary === 'string' && cp.secondary ? toHex(cp.secondary) : '#f5f5f5',
        accent: typeof cp.accent === 'string' && cp.accent ? toHex(cp.accent) : '#8B5CF6',
      },
      typography: {
        heading: typeof ty.heading === 'string' && ty.heading ? ty.heading.trim() : 'Inter',
        body: typeof ty.body === 'string' && ty.body ? ty.body.trim() : 'Inter',
      },
      logoRationale,
    };
  } catch {
    return {
      colorPalette: { primary: '#1a1a1a', secondary: '#f5f5f5', accent: '#8B5CF6' },
      typography: { heading: 'Inter', body: 'Inter' },
    };
  }
}

/** Un pas de la to-do création de site (Shopify mono-produit). */
export interface SiteCreationTodoStep {
  id: string;
  label: string;
  done?: boolean;
}

/** Génère la to-do complète A–Z pour créer un site Shopify mono-produit, basée sur la stratégie "Site internet" de la marque. */
export async function generateSiteCreationTodo(
  creatorBrandName: string,
  strategyText: string
): Promise<SiteCreationTodoStep[]> {
  const strategyExcerpt = strategyText.trim().slice(0, 6000);
  const system = `Tu es un expert e-commerce Shopify et Stripe. Tu génères une liste d'étapes TRÈS DÉTAILLÉES et ordonnées pour lancer un site mono-produit sur Shopify, en t'appuyant sur la "stratégie site" (section Site internet) de la marque.
RÈGLES :
- 30 à 50 étapes actionnables, du tout début à la mise en ligne. Chaque étape = une action claire.
- Ordre logique : 
  1) Compte Shopify (inscription via lien partenaire).
  2) Paramètres boutique (nom, devise EUR, adresse).
  3) Thème : Recommander DAWNS (gratuit, ultra-rapide) et expliquer sa configuration mono-produit.
  4) Créer le produit : Titre, prix psychologique, et variantes.
  5) Contenu IA : Coller la description générée par Outfity et uploader les visuels (Design Studio / AI Mannequin).
  6) CONFIGURATION DESIGN PRO : Appliquer la palette HEX fournie, configurer les polices.
  7) SECTION "DEV CORNER" : Ajouter le Custom CSS Outfity pour des boutons premium et des espacements aérés.
  8) MARQUAGE CONFIANCE : Ajouter le code Liquid dans le footer pour afficher "Partenaire Officiel Outfity [Logo]".
  9) Paiements : Configuration Stripe A-Z (très détaillé).
  10) Livraison : Stratégie de livraison gratuite vs payante.
  11) Domaine et Mise en ligne.
- Sois très concret : noms de menus Shopify, liens Stripe, recommandations précises.
- Réponds UNIQUEMENT par un JSON valide : { "steps": [ { "id": "1", "label": "Texte de l'étape en français" }, ... ] }. Pas de markdown.`;

  const user = `Marque du créateur : "${creatorBrandName}".
Stratégie complète (extrait, la section "Site internet" est prioritaire pour adapter les conseils) :\n${strategyExcerpt}\n\nGénère la liste complète A–Z des étapes pour créer le site Shopify mono-produit (compte Shopify, thème, produit, textes, visuels, Stripe, livraison, domaine, lancement). Réponds uniquement par le JSON.`;

  const text = await generateText(system, user, { maxTokens: 4000, temperature: 0.3 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as { steps?: { id?: string; label?: string }[] };
    const steps = Array.isArray(data.steps) ? data.steps : [];
    return steps
      .filter((s) => s && (s.label || s.id))
      .map((s, i) => ({
        id: typeof s.id === 'string' && s.id ? s.id : String(i + 1),
        label: typeof s.label === 'string' && s.label ? s.label.trim() : `Étape ${i + 1}`,
        done: false,
      }));
  } catch {
    return [
      { id: '1', label: 'Créer votre compte Shopify (bouton ci-dessous)', done: false },
      { id: '2', label: 'Paramètres boutique : nom, devise EUR, adresse', done: false },
      { id: '3', label: 'Choisir le thème Dawn (gratuit, idéal mono-produit) dans Boutique en ligne > Thèmes', done: false },
      { id: '4', label: 'Créer le produit : titre et prix', done: false },
      { id: '5', label: 'Générer la description produit avec l\'outil ci-dessous puis coller dans la fiche', done: false },
      { id: '6', label: 'Générer les visuels avec le Design Studio (mockup / shooting) puis les ajouter au produit', done: false },
      { id: '7', label: 'Créer un compte Stripe sur stripe.com', done: false },
      { id: '8', label: 'Dans Shopify : Paramètres > Paiements > Ajouter Stripe et connecter', done: false },
      { id: '9', label: 'Configurer livraison : zones et tarifs', done: false },
      { id: '10', label: 'Activer le domaine et lancer la boutique', done: false },
    ];
  }
}

/** Textes pour le site (produit, hero) générés à partir de la stratégie de la marque. */
export interface SiteTextsResult {
  productTitle: string;
  productDescription: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

/** Génère les textes du site (titre produit, description, hero) à partir de la stratégie. */
export async function generateSiteTextsFromStrategy(
  creatorBrandName: string,
  strategyText: string,
  productType?: string
): Promise<SiteTextsResult> {
  const excerpt = strategyText.trim().slice(0, 5000);
  const product = productType?.trim() || 'produit phare';
  const system = `Tu es un rédacteur e-commerce mode. À partir de la stratégie de la marque, tu génères les textes pour un site mono-produit.
Réponds UNIQUEMENT par un JSON valide avec exactement ces clés (pas de markdown) :
- productTitle : titre produit court et vendeur (5-10 mots)
- productDescription : paragraphe de description produit (2-4 phrases), aligné avec la marque
- heroTitle : accroche principale pour la page d'accueil (une phrase courte)
- heroSubtitle : sous-titre hero optionnel (une phrase)`;

  const user = `Marque : "${creatorBrandName}". Type de produit : ${product}.
Stratégie (extrait) :\n${excerpt}\n\nGénère productTitle, productDescription, heroTitle et heroSubtitle pour le site. JSON uniquement.`;

  const text = await generateText(system, user, { maxTokens: 800, temperature: 0.5 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as Record<string, string>;
    return {
      productTitle: typeof data.productTitle === 'string' ? data.productTitle.trim() : '',
      productDescription: typeof data.productDescription === 'string' ? data.productDescription.trim() : '',
      heroTitle: typeof data.heroTitle === 'string' ? data.heroTitle.trim() : undefined,
      heroSubtitle: typeof data.heroSubtitle === 'string' ? data.heroSubtitle.trim() : undefined,
    };
  } catch {
    return {
      productTitle: creatorBrandName,
      productDescription: '',
      heroTitle: creatorBrandName,
      heroSubtitle: '',
    };
  }
}

/** Identité visuelle recommandée pour le créateur : inspirée de la marque de référence (même style) mais couleurs et polices différentes + recommandation logo. */
export interface CreatorVisualIdentityRecommendation {
  colorPalette: { primary?: string; secondary?: string; accent?: string };
  typography: { heading?: string; body?: string };
  logoRecommendation?: string;
}

/** Génère une identité visuelle pour la marque du créateur, inspirée de la marque de référence (même style) sans reprendre les mêmes couleurs ni polices. Optionnel : envoie le logo de la marque de référence pour décrire de quoi peut être constitué le logo du client. */
export async function generateCreatorVisualIdentityFromTemplate(
  templateBrandName: string,
  templateVisualIdentity: VisualIdentityRecommendation,
  creatorBrandName: string,
  options: { referenceLogoUrl?: string; strategyText?: string } = {}
): Promise<CreatorVisualIdentityRecommendation> {
  const refColors = templateVisualIdentity.colorPalette
    ? `Couleurs de la marque de référence (à ne pas recopier, juste s'en inspirer) : primaire ${templateVisualIdentity.colorPalette.primary ?? '—'}, secondaire ${templateVisualIdentity.colorPalette.secondary ?? '—'}, accent ${templateVisualIdentity.colorPalette.accent ?? '—'}.`
    : '';
  const refTypos = templateVisualIdentity.typography
    ? `Polices de la marque de référence (à ne pas recopier) : titres "${templateVisualIdentity.typography.heading ?? '—'}", corps "${templateVisualIdentity.typography.body ?? '—'}".`
    : '';
  const strategyExcerpt = options.strategyText?.trim()
    ? `\n\nExtrait stratégie créateur (contexte) :\n${options.strategyText.slice(0, 1500)}\n`
    : '';

  const system = `Tu es un expert en identité de marque et design. Tu proposes une identité visuelle pour la marque du CRÉATEUR ("${creatorBrandName}"), en t'inspirant du STYLE de la marque de référence "${templateBrandName}" mais sans reprendre les mêmes couleurs ni les mêmes polices.
RÈGLES :
- Même univers visuel (ex. streetwear, luxe, minimaliste) que la marque de référence, mais propose des couleurs HEX différentes et des polices différentes (même registre, pas des copies).
- Réponds UNIQUEMENT par un objet JSON valide, sans markdown ni texte autour.
- Clés obligatoires : colorPalette (objet avec primary, secondary, accent en #RRGGBB), typography (objet avec heading, body en noms de polices).
- Clé optionnelle : logoRecommendation (string, 2 à 4 phrases en français) : décris de quoi peut être constitué le logo du client (éléments, composition, style) en t'inspirant de la marque de référence sans le copier.`;

  const userText = `Marque de référence (inspiration) : "${templateBrandName}". ${refColors} ${refTypos}
Marque du créateur : "${creatorBrandName}".${strategyExcerpt}
${options.referenceLogoUrl ? 'Une image du logo de la marque de référence est jointe. En t\'en inspirant (sans le copier), décris dans logoRecommendation de quoi peut être constitué le logo du client : éléments visuels, composition, style (2 à 4 phrases).' : 'Sans image de logo : propose une courte recommandation logo (logoRecommendation) décrivant des éléments et un style cohérents avec l\'univers de la marque de référence.'}

Propose une identité (3 couleurs hex différentes de la référence + 2 polices différentes + logoRecommendation). Réponds uniquement par le JSON.`;

  const text = await generateTextWithOptionalImage(system, userText, {
    imageUrl: options.referenceLogoUrl,
    maxTokens: 600,
    temperature: 0.6,
  });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as Record<string, unknown>;
    const cp = data.colorPalette && typeof data.colorPalette === 'object' ? (data.colorPalette as Record<string, string>) : {};
    const ty = data.typography && typeof data.typography === 'object' ? (data.typography as Record<string, string>) : {};
    const toHex = (s: string) => (/^#[0-9A-Fa-f]{6}$/.test(s) ? s : `#${(s.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6) || '000000').padEnd(6, '0')}`);
    const logoRec = typeof data.logoRecommendation === 'string' && data.logoRecommendation.trim() ? data.logoRecommendation.trim() : undefined;
    return {
      colorPalette: {
        primary: typeof cp.primary === 'string' && cp.primary ? toHex(cp.primary) : '#1a1a1a',
        secondary: typeof cp.secondary === 'string' && cp.secondary ? toHex(cp.secondary) : '#f5f5f5',
        accent: typeof cp.accent === 'string' && cp.accent ? toHex(cp.accent) : '#8B5CF6',
      },
      typography: {
        heading: typeof ty.heading === 'string' && ty.heading ? ty.heading.trim() : 'Inter',
        body: typeof ty.body === 'string' && ty.body ? ty.body.trim() : 'Inter',
      },
      logoRecommendation: logoRec,
    };
  } catch {
    return {
      colorPalette: { primary: '#1a1a1a', secondary: '#f5f5f5', accent: '#8B5CF6' },
      typography: { heading: 'Inter', body: 'Inter' },
    };
  }
}

/** Enrichissement des champs produit tendance (hors segment et marketZone). */
export async function enrichProductDetails(product: {
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
}): Promise<Record<string, unknown>> {
  const existing = [
    product.material ? `Matière: ${product.material}` : null,
    product.style ? `Style: ${product.style}` : null,
    product.color ? `Couleur: ${product.color}` : null,
    product.careInstructions ? `Entretien: ${product.careInstructions}` : null,
    product.cut ? `Coupe: ${product.cut}` : null,
    product.description ? `Description: ${product.description.slice(0, 300)}` : null,
  ].filter(Boolean).join('; ');

  const marketTruth = require('./market-truth.json');
  const marketSignals = JSON.stringify(marketTruth.trendingSignals);

  const system = `Tu es Outfity Intelligence, l'algorithme IA leader pour la détection de tendances sociales et la curation de mode.
Ton rôle est de compléter la fiche technique et stratégique d'un vêtement en te basant sur des signaux de viralité sociale (Indice IVS).

Voici les signaux de marché actuels à utiliser pour ta validation (Base de Vérité) :
${marketSignals}

Règles: Réponds UNIQUEMENT en JSON. category: T-shirt, Hoodie, Pantalon, Jean, Veste, Blouson, Pull, Polo, Short, Robe, Cargo, Jogging, Legging. complexityScore: "Facile"|"Moyen"|"Complexe". sustainabilityScore: 0-100. visualAttractivenessScore: ceci correspond à l'IVS (0-100). estimatedCogsPercent: 15-50. dominantAttribute: le "Killer Detail" viral. productBrand: la vraie marque (Nike, Mango, Boss).
Si skipImageAnalysis est vrai, rédige une analyse business focalisée sur le "Market Fit" social très COURTE (1-2 phrases).`;

  const user = [
    `Produit: ${product.name}. Catégorie: ${product.category}. Prix: ${product.averagePrice}€`,
    existing ? `Données existantes: ${existing}` : '',
    product.skipImageAnalysis ? 'NOTE: Analyse ultra-concise demandée.' : '',
    'Retourne JSON avec: category, style, material, color, careInstructions, description, cut, productBrand, estimatedCogsPercent, complexityScore, sustainabilityScore, visualAttractivenessScore, dominantAttribute. Exclure champs déjà remplis. UNIQUEMENT JSON valide.',
  ].filter(Boolean).join('\n');

  if (!user.trim()) return {}; // Sécurité contre message vide

  const canAnalyzeImage = product.imageUrl &&
    product.imageUrl.startsWith('http') &&
    !product.skipImageAnalysis;

  const text = await generateTextWithOptionalImage(system, user, {
    imageUrl: canAnalyzeImage ? product.imageUrl! : undefined,
    maxTokens: 500,
    temperature: 0.3,
  });

  const cleaned = (text || '').replace(/^```json?\s*|\s*```$/g, '').trim();
  if (!cleaned) return {};
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Analyse business multi-zones — court, peut rester sur GPT ; exposé ici pour cohérence si tu veux le passer à Claude. */
export async function generateBusinessAnalysisForZones(
  productName: string,
  zones: string[],
  trendScoresByZone: Record<string, number>
): Promise<string> {
  const zonesList = zones.join(', ');
  const scoresText = Object.entries(trendScoresByZone)
    .map(([z, s]) => `${z}: ${s}/100`)
    .join(' ; ');
  const system = `Tu es un expert retail mode mondial. En 1 à 3 phrases courtes, rédige une "Analyse Business" exploitable pour un décideur : saturation par zone, opportunité de lancement (ex: "Le marché US sature sur ce produit, opportunité de lancement immédiat sur le marché EU."). Réponds en français.`;
  const user = `Produit : ${productName}. Zones : ${zonesList}. Scores tendance par zone : ${scoresText}. Génère l'analyse business.`;
  const text = await generateText(system, user, { maxTokens: 200, temperature: 0.5 });
  return text || 'Aucune analyse.';
}

/** Données extraites d'un site web pour une marque (créateur "j'ai déjà ma marque"). */
export interface ParsedWebsiteBrand {
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  description: string | null;
  domain: string | null;
  socialHandles: { instagram?: string; twitter?: string; facebook?: string; tiktok?: string } | null;
  colorPalette: { primary?: string; secondary?: string; accent?: string } | null;
}

/**
 * Extrait les infos de marque depuis le contenu HTML d'une page (meta + texte).
 * Utilisé pour le parcours "J'ai déjà ma marque" : l'IA lit le site et récupère nom, logo, etc.
 */
export async function parseWebsiteBrandInfo(htmlSnippet: string, pageUrl: string): Promise<ParsedWebsiteBrand> {
  const system = `Tu es un expert en extraction d'informations de marque depuis des sites web.
À partir du contenu HTML (meta tags, titre, extrait de texte) d'une page, tu extrais les données de la marque au format JSON strict.
Retourne UNIQUEMENT un objet JSON valide, sans markdown ni texte autour, avec exactement ces clés :
- name (string) : nom de la marque
- logoUrl (string ou null) : URL absolue du logo (og:image, ou lien vers image logo dans la page). Si plusieurs, choisis le plus pertinent (logo principal).
- tagline (string ou null) : slogan / baseline
- description (string ou null) : courte description de la marque
- domain (string ou null) : domaine du site (ex: example.com)
- socialHandles (objet ou null) : { instagram?, twitter?, facebook?, tiktok? } avec les handles ou URLs
- colorPalette (objet ou null) : { primary?, secondary?, accent? } en hex (#RRGGBB) si trouvé dans la page

Si une info est introuvable, mets null. Pour logoUrl, préfère une URL absolue (https://...).`;

  const user = `URL de la page : ${pageUrl}\n\nContenu HTML / meta / texte à analyser :\n${htmlSnippet.slice(0, 12000)}`;

  const text = await generateText(system, user, { maxTokens: 600, temperature: 0.3 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      name: typeof data.name === 'string' ? data.name : '',
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : null,
      tagline: typeof data.tagline === 'string' ? data.tagline : null,
      description: typeof data.description === 'string' ? data.description : null,
      domain: typeof data.domain === 'string' ? data.domain : null,
      socialHandles: data.socialHandles && typeof data.socialHandles === 'object' ? (data.socialHandles as ParsedWebsiteBrand['socialHandles']) : null,
      colorPalette: data.colorPalette && typeof data.colorPalette === 'object' ? (data.colorPalette as ParsedWebsiteBrand['colorPalette']) : null,
    };
  } catch {
    return {
      name: '',
      logoUrl: null,
      tagline: null,
      description: null,
      domain: null,
      socialHandles: null,
      colorPalette: null,
    };
  }
}

/** Contexte marque pour les recommandations "Gérer ma marque" (vue d'ensemble). */
export interface LaunchMapRecommendationsContext {
  brandName: string;
  productType?: string | null;
  productWeight?: string | null;
  templateBrandSlug?: string | null;
  positioning?: string | null;
  targetAudience?: string | null;
  story?: string | null;
  tagline?: string | null;
  phase1Data?: Record<string, unknown> | null;
  designCount: number;
  quoteCount: number;
  suppliersCount: number;
  ugcCount: number;
  completedPhases: number;
}

/**
 * Génère des recommandations conseil pour la vue d'ensemble "Gérer ma marque".
 * Ton conseil, bienveillant, cohérent avec une app d'accompagnement au lancement de marque mode.
 * Utilisé uniquement quand identité + stratégie sont complétées ; régénération au plus 1 fois / 24h.
 */
export async function generateLaunchMapRecommendations(
  context: LaunchMapRecommendationsContext
): Promise<string[]> {
  const system = `Tu es un conseiller pour créateurs de marques mode, au ton bienveillant et professionnel. Tu rédiges des recommandations conseil : courtes, personnalisées et alignées avec l'univers de la marque (secteur, marque d'inspiration, cible).

Règles :
- Réponds UNIQUEMENT par une liste numérotée de 4 à 6 recommandations conseil (une par ligne, format "1. ..." "2. ...").
- Chaque recommandation = 1 à 2 phrases, en français, ton conseil (pas impératif), adapté à l'app d'accompagnement au lancement.
- Prends en compte : marque d'inspiration (secteur), cible, type de produit, positionnement, et où en est la marque (phases, designs, devis, fournisseurs, UGC).
- Formule en conseil ("Nous vous conseillons de...", "Il peut être pertinent de...", "Pour renforcer votre positionnement...") plutôt qu'en ordres.
- Reste cohérent avec une plateforme qui accompagne étape par étape (identité → stratégie → calculatrice → design → sourcing → go-to-market).
- Adapte le ton au positionnement (streetwear, luxe accessible, etc.) sans être guindé.`;

  const user = `Contexte de la marque à conseiller :

Nom : ${context.brandName}
Type de produit : ${context.productType ?? 'non renseigné'}
Grammage : ${context.productWeight ?? 'non renseigné'}
Marque d'inspiration (secteur) : ${context.templateBrandSlug ?? 'non renseigné'}
Positionnement / style : ${context.positioning ?? 'non renseigné'}
Cible audience : ${context.targetAudience ?? 'non renseigné'}
Tagline : ${context.tagline ?? 'non renseigné'}
Story (résumé) : ${context.story ? context.story.slice(0, 300) + (context.story.length > 300 ? '...' : '') : 'non renseigné'}

Où en est la marque :
- Designs créés : ${context.designCount}
- Devis envoyés : ${context.quoteCount}
- Fournisseurs : ${context.suppliersCount}
- Scripts UGC : ${context.ugcCount}
- Phases complétées : ${context.completedPhases} / 7

${context.phase1Data ? `Données calculatrice (rentabilité) : à utiliser pour des conseils prix/rentabilité si pertinent.\n` : ''}

Génère 4 à 6 recommandations conseil personnalisées, en bon sens avec notre app d'accompagnement.`;

  const text = await generateText(system, user, { maxTokens: 800, temperature: 0.5 });
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter((l) => l.length > 10);
  return lines.slice(0, 8);
}

export type GeneratedPostPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'x';

export interface GeneratedPost {
  platform: GeneratedPostPlatform;
  text: string;
}

/**
 * Génère des posts adaptés à chaque plateforme à partir de la stratégie de contenu (section 6) de la marque.
 * Utilisé après connexion Shopify (phase 6) : l'utilisateur peut planifier ces posts dans le calendrier.
 */
export async function generatePostsFromContentStrategy(
  strategyText: string,
  brandName: string
): Promise<GeneratedPost[]> {
  const contentSection = strategyText.includes('## 6. Stratégie de contenu')
    ? strategyText.split('## 6. Stratégie de contenu')[1]?.split(/##\s+\d/)[0]?.trim() || strategyText.slice(-2500)
    : strategyText.slice(-2500);

  const system = `Tu es un expert en contenu et réseaux sociaux pour marques mode. À partir de la "Stratégie de contenu" d'une marque, tu génères des posts courts et adaptés à chaque plateforme.

Règles :
- Réponds UNIQUEMENT par un objet JSON valide avec une clé "posts" : tableau d'objets { "platform": "instagram"|"tiktok"|"linkedin"|"facebook"|"x", "text": "..." }.
- Génère exactement un post par plateforme : instagram, tiktok, linkedin, facebook, x (5 posts au total).
- Chaque "text" = le contenu du post (caption / texte) adapté aux codes de la plateforme :
  - Instagram : ton visuel, hashtags pertinents (3-5), longueur adaptée caption
  - TikTok : accroche courte, ton dynamique, CTA
  - LinkedIn : ton professionnel, valeur ajoutée
  - Facebook : mix informatif et communautaire
  - X (Twitter) : concis, punchy, 1-2 phrases max
- Pas de markdown dans les textes. Pas de préfixe "Instagram :" dans le texte, juste le contenu.
- Tout en français. Cohérent avec la stratégie de contenu fournie.`;

  const user = `Marque : ${brandName}

Stratégie de contenu (extrait) :
${contentSection.slice(0, 3000)}

Génère les 5 posts (instagram, tiktok, linkedin, facebook, x) au format JSON : { "posts": [ { "platform": "...", "text": "..." }, ... ] }`;

  const text = await generateText(system, user, { maxTokens: 1600, temperature: 0.6 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  const platforms: GeneratedPostPlatform[] = ['instagram', 'tiktok', 'linkedin', 'facebook', 'x'];
  try {
    const data = JSON.parse(cleaned) as { posts?: Array<{ platform?: string; text?: string }> };
    const arr = Array.isArray(data.posts) ? data.posts : [];
    const result: GeneratedPost[] = [];
    for (const p of platforms) {
      const found = arr.find((x) => String(x.platform).toLowerCase() === p);
      result.push({
        platform: p,
        text: (found && typeof found.text === 'string' && found.text.trim()) ? found.text.trim() : `Post ${p} pour ${brandName}`,
      });
    }
    return result;
  } catch {
    return platforms.map((p) => ({ platform: p, text: `Post ${p} pour ${brandName}` }));
  }
}

/** Contenu structuré d’un post (titre, corps, CTA, hashtags, description) pour le calendrier. */
export interface StructuredPostContentGenerated {
  headline?: string;
  body?: string;
  cta?: string;
  hashtags?: string;
  description?: string;
}

/**
 * Génère un post structuré (accroche, corps, CTA, hashtags) pour une plateforme donnée,
 * à partir de la stratégie complète de la marque. Si clothesReceived : contenu autour du vêtement en visuel ; sinon : teaser (coming soon).
 */
export async function generateStructuredPostFromStrategy(
  strategyText: string,
  brandName: string,
  platform: GeneratedPostPlatform,
  clothesReceived: boolean = true
): Promise<StructuredPostContentGenerated> {
  const contextHint = clothesReceived
    ? 'Le créateur a reçu le vêtement : propose un contenu qui met en valeur le produit (visuel, détail, porté, look).'
    : 'Le contenu sera réalisé via UGC LAB avec l\'IA : génère du contenu normalement comme si c\'étaient des humains qui créent (même qualité, même ton). Eux réaliseront avec l\'IA dans UGC LAB.';

  const system = `Tu es un expert en contenu et réseaux sociaux pour marques mode. Tu génères un post structuré (titre, corps, CTA, hashtags) pour une plateforme donnée, en t'appuyant sur la stratégie complète de la marque (vision, positionnement, cible, offre, canaux, messages, stratégie de contenu).

Règles :
- Réponds UNIQUEMENT par un objet JSON valide avec les clés : headline (string), body (string), cta (string), hashtags (string), description (string).
- headline : titre ou accroche percutant (une phrase courte).
- body : corps du message (2 à 5 phrases), ton adapté à la marque et à la plateforme.
- cta : call-to-action clair (ex. "Lien en bio", "Découvrez la collection", "Swipe pour voir").
- hashtags : 3 à 6 hashtags pertinents, séparés par des espaces (ex. "#mode #streetwear #nouveauté"), adaptés à la plateforme.
- description : courte description du post (1 à 2 phrases, type meta description ou résumé pour référence).
- Tout en français. Cohérent avec la stratégie fournie. Adapte le ton et la longueur à la plateforme (Instagram visuel, TikTok dynamique, LinkedIn pro, etc.).
- Contexte important : ${contextHint}`;

  const platformHint: Record<string, string> = {
    instagram: 'Instagram : ton visuel, caption engageante, hashtags pour la découvrabilité.',
    tiktok: 'TikTok : accroche courte, ton dynamique et authentique, CTA vers le lien en bio ou la suite.',
    linkedin: 'LinkedIn : ton professionnel, valeur ajoutée, mise en avant de l\'expertise ou du positionnement.',
    facebook: 'Facebook : mix informatif et communautaire, encourageant les réactions et partages.',
    x: 'X (Twitter) : concis, punchy, hashtags limités (1-2).',
  };

  const user = `Marque : ${brandName}
Plateforme : ${platform}
${platformHint[platform] || ''}
${contextHint}

Stratégie complète de la marque :
${strategyText.slice(0, 6000)}

Génère un post structuré (headline, body, cta, hashtags, description) pour ${platform}. Réponds uniquement par le JSON.`;

  const text = await generateText(system, user, { maxTokens: 800, temperature: 0.6 });
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const data = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      headline: typeof data.headline === 'string' ? data.headline.trim() : undefined,
      body: typeof data.body === 'string' ? data.body.trim() : undefined,
      cta: typeof data.cta === 'string' ? data.cta.trim() : undefined,
      hashtags: typeof data.hashtags === 'string' ? data.hashtags.trim() : undefined,
      description: typeof data.description === 'string' ? data.description.trim() : undefined,
    };
  } catch {
    return {};
  }
}

/** Résultat d’extraction de la fréquence de publication depuis la stratégie de contenu (section 6). */
export interface ContentStrategyFrequency {
  maxPostsPerDay: number;
  label?: string;
  /** Heure de publication recommandée (HH:mm, ex. "18:00"). */
  recommendedPostTime?: string;
}

/** Normalise une chaîne heure (9h, 18h30, 09:00) en "HH:mm". */
export function normalizePostTime(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '18:00';
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2})[h:](\d{0,2})$/i) ?? trimmed.match(/^(\d{1,2})h$/i);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const m = match[2] ? Math.min(59, Math.max(0, parseInt(match[2], 10))) : 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':').map((n) => parseInt(n, 10));
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return '18:00';
}

/**
 * Extrait la fréquence de publication (max posts par jour) depuis la section "Stratégie de contenu"
 * de la stratégie marketing. Utilisé pour adapter la limite de posts dans le calendrier (pas une limite fixe 1/jour).
 */
export async function extractContentFrequencyFromStrategy(
  strategyText: string
): Promise<ContentStrategyFrequency> {
  const contentSection = strategyText.includes('## 6. Stratégie de contenu')
    ? strategyText.split('## 6. Stratégie de contenu')[1]?.split(/##\s+\d/)[0]?.trim() || strategyText.slice(-2000)
    : strategyText.slice(-2000);

  const system = `Tu es un expert en stratégie de contenu pour marques mode. À partir de la section "Stratégie de contenu" (fréquence, calendrier éditorial, créneaux de publication), tu en déduis :
1) maxPostsPerDay (entier 1-10), label (string court français).
2) recommendedPostTime : heure de publication recommandée au format "HH:mm" (ex. "18:00", "09:00"). Si la stratégie mentionne un créneau (ex. "le soir", "18h", "9h") utilise-le ; sinon "18:00".

Réponds UNIQUEMENT par un JSON : { "maxPostsPerDay": number, "label": "...", "recommendedPostTime": "HH:mm" }`;

  const user = `Stratégie de contenu (extrait) :
${contentSection.slice(0, 2500)}

Extrais fréquence et heure de post. JSON : { "maxPostsPerDay": number, "label": "...", "recommendedPostTime": "HH:mm" }`;

  try {
    const text = await generateText(system, user, { maxTokens: 220, temperature: 0.2 });
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim();
    const data = JSON.parse(cleaned) as { maxPostsPerDay?: number; label?: string; recommendedPostTime?: string };
    const max = typeof data.maxPostsPerDay === 'number' && data.maxPostsPerDay >= 1
      ? Math.min(10, Math.round(data.maxPostsPerDay))
      : 1;
    const recommendedPostTime = normalizePostTime(data.recommendedPostTime);
    return {
      maxPostsPerDay: max,
      label: typeof data.label === 'string' && data.label.trim() ? data.label.trim() : `${max} post${max > 1 ? 's' : ''} par jour`,
      recommendedPostTime,
    };
  } catch {
    return { maxPostsPerDay: 1, label: '1 post par jour (par défaut)', recommendedPostTime: '18:00' };
  }
}
