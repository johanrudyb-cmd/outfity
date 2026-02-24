import { sanitizeErrorMessage } from './utils';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Service d'envoi d'emails via l'API Resend
 */
export async function sendEmail({
    to,
    subject,
    html,
    from = 'OUTFITY <send@outfity.fr>'
}: SendEmailParams) {
    if (!RESEND_API_KEY) {
        console.warn('[Mail] RESEND_API_KEY manquante. Email non envoyé.');
        return { success: false, error: 'API Key missing' };
    }

    try {
        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Mail] Erreur Resend:', data);
            return { success: false, error: data.message || 'Unknown error' };
        }

        console.log('[Mail] Email envoyé avec succès:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Mail] Erreur lors de l\'envoi:', msg);
        return { success: false, error: msg };
    }
}
