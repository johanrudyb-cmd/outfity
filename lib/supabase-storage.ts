/**
 * Supabase Storage helper — upload de fichiers vers un bucket public.
 * Les images uploadées ici ont une URL publique permanente, accessible
 * par des services tiers comme Higgsfield AI.
 */
import { createClient } from '@supabase/supabase-js';

// L'ID du projet est extrait de l'URL de la base de données
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qlefdfepdgdzjgatghjc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Bucket public pour tous les uploads UGC (mannequins, designs, etc.) */
const BUCKET_NAME = 'media';

function getSupabaseAdmin() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d\'environnement');
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function isSupabaseStorageConfigured(): boolean {
    return !!SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Upload un buffer d'image vers Supabase Storage.
 * Retourne l'URL publique permanente.
 */
export async function uploadToSupabaseStorage(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder?: string
): Promise<string> {
    const supabase = getSupabaseAdmin();

    // Construction du chemin dans le bucket
    const path = folder ? `${folder}/${filename}` : filename;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
            contentType: mimetype,
            upsert: true, // Écrase si le fichier existe déjà
        });

    if (error) {
        // Si le bucket n'existe pas, on essaie de le créer
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
            await createBucketIfNotExists(supabase);
            // Réessayer l'upload
            const { data: retryData, error: retryError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(path, buffer, {
                    contentType: mimetype,
                    upsert: true,
                });
            if (retryError) {
                throw new Error(`Supabase Storage upload failed: ${retryError.message}`);
            }
        } else {
            throw new Error(`Supabase Storage upload failed: ${error.message}`);
        }
    }

    // Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return publicUrlData.publicUrl;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createBucketIfNotExists(supabase: any) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20MB max
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    // Ignorer l'erreur si le bucket existe déjà
    if (error && !error.message?.includes('already exists')) {
        throw new Error(`Impossible de créer le bucket: ${error.message}`);
    }
}

/**
 * Upload une image depuis une URL externe vers Supabase Storage.
 * Utile pour ré-héberger des images générées par des APIs (ex: Higgsfield).
 */
export async function uploadUrlToSupabaseStorage(
    imageUrl: string,
    filename: string,
    folder?: string
): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Impossible de télécharger l'image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return uploadToSupabaseStorage(buffer, filename, contentType, folder);
}
