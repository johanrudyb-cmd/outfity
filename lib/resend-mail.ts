import { sanitizeErrorMessage } from './utils';

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
    from = 'OUTFITY <no-reply@send.outfity.fr>'
}: SendEmailParams) {
    const apiKey = (process.env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
        console.warn('[Mail] RESEND_API_KEY manquante. Email non envoyé.');
        return { success: false, error: 'API Key missing' };
    }

    try {
        const payload = {
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        };
        console.log(`[Mail] Payload sent to Resend:`, JSON.stringify(payload, (key, value) => {
            if (key === 'html') return value.substring(0, 100) + '...';
            return value;
        }, 2));

        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Mail] Erreur API Resend:', JSON.stringify(data, null, 2));
            let errorMsg = data.message || 'Erreur inconnue';
            if (errorMsg.includes('not verified')) {
                errorMsg = "Le domaine '" + from + "' n'est pas vérifié sur Resend.";
            }
            return { success: false, error: errorMsg };
        }

        console.log('[Mail] Email envoyé avec succès:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Mail] Erreur lors de l\'envoi:', msg);
        return { success: false, error: msg };
    }
}
