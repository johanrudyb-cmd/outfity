
/**
 * OUTFITY - Premium Email Templates
 * Inspired by Apple/Stripe aesthetic
 */

interface BaseTemplateProps {
    title: string;
    description: string;
    buttonText?: string;
    buttonUrl?: string;
    footerText?: string;
}

const getBaseTemplate = ({ title, description, buttonText, buttonUrl, footerText }: BaseTemplateProps) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f7;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .card {
            background-color: #ffffff;
            border-radius: 32px;
            padding: 48px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
            text-align: center;
        }
        
        .logo {
            width: 64px;
            height: 64px;
            margin-bottom: 32px;
            border-radius: 16px;
        }
        
        h1 {
            color: #1d1d1f;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.02em;
            margin-bottom: 16px;
            line-height: 1.1;
            text-transform: uppercase;
        }
        
        p {
            color: #86868b;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
            font-weight: 500;
        }
        
        .button {
            display: inline-block;
            background-color: #007aff;
            color: #ffffff !important;
            padding: 16px 32px;
            border-radius: 100px;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .footer {
            margin-top: 32px;
            text-align: center;
            color: #c7c7cc;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        .divider {
            height: 1px;
            background-color: #f5f5f7;
            margin: 32px 0;
        }

        .secondary-text {
            color: #c7c7cc;
            font-size: 13px;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <img src="https://outfity.fr/icon.png" alt="OUTFITY" class="logo">
            <h1>${title}</h1>
            <p>${description}</p>
            
            ${buttonText && buttonUrl ? `
                <a href="${buttonUrl}" class="button">
                    ${buttonText}
                </a>
            ` : ''}
            
            ${footerText ? `
                <div class="divider"></div>
                <p class="secondary-text">${footerText}</p>
            ` : ''}
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} OUTFITY STUDIO — LANCE TA MARQUE.
        </div>
    </div>
</body>
</html>
`;

export const getTemplates = {
    passwordReset: (name: string, url: string) => getBaseTemplate({
        title: "Mot de passe oublié ?",
        description: `Bonjour ${name},<br><br>Nous avons reçu une demande de réinitialisation pour votre compte OUTFITY. Si c'est bien vous, cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.`,
        buttonText: "Réinitialiser mon mot de passe",
        buttonUrl: url,
        footerText: "Ce lien expirera dans une heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité."
    }),

    emailVerification: (name: string, url: string) => getBaseTemplate({
        title: "Confirme ton email",
        description: `Bienvenue chez OUTFITY, ${name} !<br><br>Il ne reste qu'une étape pour activer ton compte et commencer à créer ta marque de vêtements.`,
        buttonText: "Confirmer mon adresse email",
        buttonUrl: url,
        footerText: "Si vous n'avez pas créé de compte sur OUTFITY, veuillez ignorer cet email."
    }),

    communityCode: (resourceName: string, code: string) => getBaseTemplate({
        title: "TON ACCÈS EST PRÊT.",
        description: `Tu as rejoint la communauté des créateurs qui construisent sérieusement.<br><br>Voici ton code d'accès exclusif pour <strong>${resourceName}</strong> :<br><br><div style="font-size: 32px; font-weight: 900; letter-spacing: 0.2em; background-color: #f5f5f7; padding: 24px; border-radius: 16px; margin: 32px 0;">${code}</div>Ce code est personnel et à usage unique.`,
        buttonText: "Débloquer ma ressource",
        buttonUrl: "https://outfity.fr/communaute",
        footerText: "Pour aller plus loin, rejoins les créateurs qui lancent leur marque avec succès grâce à OUTFITY."
    })
};
