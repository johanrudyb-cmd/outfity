/**
 * Client API Higgsfield — génération d'images (text-to-image).
 * Utilisé pour la création des mockups (vêtement avec design, pas de mannequin).
 * @see https://docs.higgsfield.ai/
 */

const HIGGSFIELD_BASE = 'https://platform.higgsfield.ai';

/** Modèle text-to-image recommandé pour mockups produit */
const DEFAULT_MODEL_ID = 'higgsfield-ai/soul/standard';

/** Modèle image-to-image pour shootings (mannequin + scène) */
const EDIT_MODEL_ID = 'bytedance/seedream/v4/edit';

export function isHiggsfieldConfigured(): boolean {
  return !!(process.env.HIGGSFIELD_API_KEY && process.env.HIGGSFIELD_API_SECRET);
}

function getAuthHeader(): string {
  const key = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_API_SECRET;
  if (!key || !secret) {
    throw new Error('HIGGSFIELD_API_KEY et HIGGSFIELD_API_SECRET doivent être définis');
  }
  return `Key ${key}:${secret}`;
}

interface SubmitResponse {
  status?: string;
  request_id?: string;
  status_url?: string;
  cancel_url?: string;
}

interface StatusResponse {
  status?: string;
  request_id?: string;
  status_url?: string;
  cancel_url?: string;
  images?: Array<{ url?: string }>;
  video?: { url?: string };
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // ~2 min

/**
 * Soumet une génération puis poll jusqu'à completion.
 * Retourne l'URL de la première image générée.
 */
export async function generateImage(
  prompt: string,
  options?: {
    aspect_ratio?: string;
    resolution?: string;
    model_id?: string;
  }
): Promise<string> {
  const modelId = options?.model_id ?? DEFAULT_MODEL_ID;
  const url = `${HIGGSFIELD_BASE}/${modelId}`;

  const body: Record<string, string> = {
    prompt,
    aspect_ratio: options?.aspect_ratio ?? '1:1',
    resolution: options?.resolution ?? '720p',
  };

  const submitRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Higgsfield submit: ${submitRes.status} — ${errText || submitRes.statusText}`);
  }

  const submitData = (await submitRes.json()) as SubmitResponse;
  const statusUrl = submitData.status_url;
  const requestId = submitData.request_id;

  if (!statusUrl || !requestId) {
    throw new Error('Higgsfield: réponse invalide (status_url ou request_id manquant)');
  }

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const statusRes = await fetch(statusUrl, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    });

    if (!statusRes.ok) {
      throw new Error(`Higgsfield status: ${statusRes.status}`);
    }

    const statusData = (await statusRes.json()) as StatusResponse;

    if (statusData.status === 'completed') {
      const imageUrl = statusData.images?.[0]?.url;
      if (imageUrl) return imageUrl;
      throw new Error('Higgsfield: aucune image dans la réponse complétée');
    }

    if (statusData.status === 'failed' || statusData.status === 'nsfw') {
      const errMsg = (statusData as { error?: string }).error || statusData.status || 'Échec';
      throw new Error(`Higgsfield: ${errMsg}`);
    }

    // queued ou in_progress → continuer à poller
  }

  throw new Error('Higgsfield: timeout (génération trop longue)');
}

/** Alias pour compatibilité avec les imports existants */
export const generateProductImage = generateImage;

/** Options complètes pour le shooting photo (infos de la page Shooting Photo). */
export interface ShootingPhotoOptions {
  /** URL de l'image du vêtement/design (référence visuelle). */
  designUrl: string;
  /** Type de vêtement (ex. T-shirt, Hoodie). */
  garmentType: string;
  /** Nom du design/vêtement (ex. "T-shirt logo bande"). */
  garmentLabel?: string;
  /** Format / ratio d'aspect (ex. 3:4, 1:1, 9:16). */
  aspectRatio?: string;
  /** Prompt scène construit (lieu, éclairage, fond, cadrage, ambiance, pose). */
  scenePrompt: string;
  /** Instruction libre utilisateur (pose, expression, action). */
  mannequinInstruction?: string;
  /** Option de pose (sélection pré-définie). */
  mannequinPoseOptional?: string;
  /** Options brutes (location, outdoorType, lighting, background, framing, mood). */
  sceneOptions?: Record<string, string>;
}

/**
 * Génère une photo de shooting à partir du mannequin (généré par Higgsfield virtual try-on)
 * et du vêtement sélectionné.
 * Utilise l'API image-to-image (Seedream edit) :
 * - image 1 : mannequin (virtual try-on)
 * - image 2 : vêtement/design (référence visuelle)
 * Prompt enrichi avec toutes les infos de la page Shooting Photo.
 */
export async function generateShootingPhoto(
  mannequinImageUrl: string,
  options: ShootingPhotoOptions
): Promise<string> {
  const opts = options;

  const modelId = EDIT_MODEL_ID;
  const url = `${HIGGSFIELD_BASE}/${modelId}`;

  const garmentDesc = opts.garmentLabel
    ? `${opts.garmentType} (${opts.garmentLabel})`
    : opts.garmentType;

  const promptParts: string[] = [
    'Professional fashion photography',
    `model wearing ${garmentDesc}`,
    opts.scenePrompt,
    'keep the model exactly as shown in the first image',
    'the garment must match the design shown in the second image',
    'high quality',
    'editorial style',
  ];
  if (opts.mannequinInstruction?.trim()) {
    promptParts.splice(3, 0, opts.mannequinInstruction.trim());
  }

  const prompt = promptParts.join(', ');

  const imageUrls = [mannequinImageUrl];
  if (opts.designUrl?.trim()) {
    imageUrls.push(opts.designUrl.trim());
  }

  const body: Record<string, unknown> = {
    prompt,
    image_urls: imageUrls,
    aspect_ratio: opts.aspectRatio || '3:4',
    resolution: '2K',
  };

  const submitRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Higgsfield shooting (image-to-image): ${submitRes.status} — ${errText || submitRes.statusText}`);
  }

  const submitData = (await submitRes.json()) as SubmitResponse;
  const statusUrl = submitData.status_url;
  const requestId = submitData.request_id;

  if (!statusUrl || !requestId) {
    throw new Error('Higgsfield: réponse invalide (status_url ou request_id manquant)');
  }

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const statusRes = await fetch(statusUrl, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    });

    if (!statusRes.ok) {
      throw new Error(`Higgsfield status: ${statusRes.status}`);
    }

    const statusData = (await statusRes.json()) as StatusResponse;

    if (statusData.status === 'completed') {
      const imageUrl = statusData.images?.[0]?.url;
      if (imageUrl) return imageUrl;
      throw new Error('Higgsfield: aucune image dans la réponse complétée');
    }

    if (statusData.status === 'failed' || statusData.status === 'nsfw') {
      const errMsg = (statusData as { error?: string }).error || statusData.status || 'Échec';
      throw new Error(`Higgsfield: ${errMsg}`);
    }
  }

  throw new Error('Higgsfield: timeout (génération trop longue)');
}

/**
 * Virtual Try-On : génère une image de mannequin portant le vêtement (design).
 * Utilise l'API image-to-image avec l'image du design comme référence.
 */
export async function generateVirtualTryOn(designUrl: string, garmentType: string): Promise<string> {
  const modelId = EDIT_MODEL_ID;
  const url = `${HIGGSFIELD_BASE}/${modelId}`;
  const prompt = `Professional fashion photography, model wearing ${garmentType}, full body, neutral background, the garment must match the design shown in the image, high quality, editorial style`;

  const body: Record<string, unknown> = {
    prompt,
    image_urls: [designUrl.trim()],
    aspect_ratio: '3:4',
    resolution: '2K',
  };

  const submitRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Higgsfield virtual try-on: ${submitRes.status} — ${errText || submitRes.statusText}`);
  }

  const submitData = (await submitRes.json()) as SubmitResponse;
  const statusUrl = submitData.status_url;
  const requestId = submitData.request_id;

  if (!statusUrl || !requestId) {
    throw new Error('Higgsfield: réponse invalide (status_url ou request_id manquant)');
  }

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const statusRes = await fetch(statusUrl, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    });
    if (!statusRes.ok) throw new Error(`Higgsfield status: ${statusRes.status}`);
    const statusData = (await statusRes.json()) as StatusResponse;
    if (statusData.status === 'completed') {
      const imageUrl = statusData.images?.[0]?.url;
      if (imageUrl) return imageUrl;
      throw new Error('Higgsfield: aucune image dans la réponse complétée');
    }
    if (statusData.status === 'failed' || statusData.status === 'nsfw') {
      const errMsg = (statusData as { error?: string }).error || statusData.status || 'Échec';
      throw new Error(`Higgsfield: ${errMsg}`);
    }
  }
  throw new Error('Higgsfield: timeout (génération trop longue)');
}
