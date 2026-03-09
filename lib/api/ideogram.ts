/**
 * Client API Ideogram — logos et designs (génération d'images à partir de texte).
 * Utilisé pour : stickers, logos, mockups de base, designs à partir de questionnaire, flat sketches, tendances.
 * @see https://developer.ideogram.ai/
 */

const IDEogram_API_BASE = 'https://api.ideogram.ai';

export function isIdeogramConfigured(): boolean {
  return !!process.env.IDEOGRAM_API_KEY;
}

/** Réponse génération Ideogram 3.0 */
interface IdeogramGenerateResponse {
  data?: Array<{ url?: string; prompt?: string; resolution?: string }>;
  created?: string;
}

/** Mappe aspect_ratio "1:1" / "3:4" vers les valeurs Ideogram (e.g. 1x1, 3x4) */
function toIdeogramAspectRatio(ratio: string): string {
  const r = (ratio || '1:1').replace(/\s/g, '');
  if (r === '1:1') return '1x1';
  if (r === '3:4') return '3x4';
  if (r === '4:3') return '4x3';
  if (r === '16:9') return '16x9';
  if (r === '9:16') return '9x16';
  return '1x1';
}

/**
 * Génère une image design/logo à partir d'un prompt (API Ideogram 3.0).
 * Pour stickers/logos : utiliser transparent: true (endpoint generate-transparent).
 * @param prompt - Prompt en anglais
 * @param options - aspect_ratio (défaut 1:1), transparent, seed (optionnel — si absent, un seed aléatoire est utilisé pour varier les résultats)
 * @returns URL de l'image générée (éphémère — à télécharger/sauvegarder côté app si besoin)
 */
export async function generateDesignImage(
  prompt: string,
  options?: { aspect_ratio?: string; transparent?: boolean; seed?: number; negative_prompt?: string }
): Promise<string> {
  if (!process.env.IDEOGRAM_API_KEY) {
    throw new Error('IDEOGRAM_API_KEY non configurée');
  }

  const aspectRatio = toIdeogramAspectRatio(options?.aspect_ratio ?? '1:1');
  const useTransparent = options?.transparent === true;
  const path = useTransparent ? '/v1/ideogram-v3/generate-transparent' : '/v1/ideogram-v3/generate';
  const url = `${IDEogram_API_BASE}${path}`;

  const seed = options?.seed ?? Math.floor(Math.random() * 2147483647);
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', aspectRatio);
  form.append('rendering_speed', 'TURBO');
  form.append('seed', String(seed));
  if (options?.negative_prompt && options.negative_prompt.trim()) {
    form.append('negative_prompt', options.negative_prompt.trim());
  }
  if (useTransparent) {
    form.append('magic_prompt', 'OFF');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY as string,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ideogram: ${res.status} — ${errText || res.statusText}`);
  }

  const data = (await res.json()) as IdeogramGenerateResponse;
  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Ideogram: aucune image dans la réponse');
  }
  return imageUrl;
}

/**
 * Génère un flat sketch technique (mode design) — délégation vers generateDesignImage.
 */
export async function generateFlatSketch(prompt: string): Promise<string> {
  const fullPrompt = `Technical fashion flat sketch, ${prompt}, black and white, front and back view, professional, detailed`;
  return generateDesignImage(fullPrompt, { aspect_ratio: '1:1', transparent: false });
}

/** Réponse Remix Ideogram 3.0 */
interface IdeogramRemixResponse {
  data?: Array<{ url?: string; prompt?: string; resolution?: string }>;
  created?: string;
}

/**
 * Remix : génère une nouvelle image à partir d’une image fournie et d’un prompt.
 * Utilisé pour intégrer le logo dans le mockup (vêtement avec design dans la génération).
 * @param imageBuffer - Image binaire (PNG/JPEG/WebP)
 * @param prompt - Prompt en anglais décrivant la scène souhaitée
 * @param options - negative_prompt (ex. mannequin, person), aspect_ratio, image_weight
 */
export async function remixImage(
  imageBuffer: Buffer,
  prompt: string,
  options?: {
    aspect_ratio?: string;
    negative_prompt?: string;
    image_weight?: number;
    seed?: number;
  }
): Promise<string> {
  if (!process.env.IDEOGRAM_API_KEY) {
    throw new Error('IDEOGRAM_API_KEY non configurée');
  }

  const aspectRatio = toIdeogramAspectRatio(options?.aspect_ratio ?? '1:1');
  const url = `${IDEogram_API_BASE}/v1/ideogram-v3/remix`;

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', aspectRatio);
  form.append('rendering_speed', 'TURBO');
  form.append('image_weight', String(options?.image_weight ?? 50));
  if (options?.seed != null) form.append('seed', String(options.seed));
  else form.append('seed', String(Math.floor(Math.random() * 2147483647)));
  if (options?.negative_prompt?.trim()) {
    form.append('negative_prompt', options.negative_prompt.trim());
  }
  form.append('image', new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' }), 'design.png');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY as string,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ideogram Remix: ${res.status} — ${errText || res.statusText}`);
  }

  const data = (await res.json()) as IdeogramRemixResponse;
  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Ideogram Remix: aucune image dans la réponse');
  }
  return imageUrl;
}
