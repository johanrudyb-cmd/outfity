
/**
 * OUTFITY Security Utilities
 * Captcha (Turnstile) & Password Robustness
 */

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export async function verifyTurnstile(token: string) {
    // En dev sans clé, on laisse passer
    if (!TURNSTILE_SECRET_KEY) {
        console.warn('[Security] TURNSTILE_SECRET_KEY manquante. Bypass du captcha.');
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', token);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (error) {
        console.error('[Security] Erreur verification Turnstile:', error);
        return false;
    }
}

export function validatePasswordStrength(password: string): { isValid: boolean, error?: string } {
    if (password.length < 10) {
        return { isValid: false, error: 'Le mot de passe doit contenir au moins 10 caractères.' };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        return {
            isValid: false,
            error: 'Utilisez un mélange de majuscules, minuscules, chiffres et caractères spéciaux.'
        };
    }

    return { isValid: true };
}
