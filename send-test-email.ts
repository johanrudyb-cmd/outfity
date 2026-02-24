import * as https from 'https';
import { config } from 'dotenv';

config(); // Load variables from .env if present

async function testMail() {
    const destinationEmail = process.argv[2];

    if (!destinationEmail) {
        console.error('❌ Erreur : Veuillez fournir une adresse email de test en argument.');
        process.exit(1);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.error('❌ Erreur: Clé RESEND_API_KEY manquante dans votre environnement (.env).');
        process.exit(1);
    }

    console.log(`🚀 Démarrage de l'envoi du mail de test à ${destinationEmail} ...`);

    const payload = JSON.stringify({
        from: 'OUTFITY <send@outfity.fr>',
        to: [destinationEmail],
        subject: "Bienvenue dans l'équipe. Voici ton plan d'attaque 🤝 (TEST DIRECT)",
        html: `
      Salut Créateur,<br><br>
      Moi c'est Virgil, ton directeur stratégique.<br><br>
      Avec Pharrell à la DA, Ada au Sourcing et Johan à la technique, ton équipe est au complet pour ces 3 Jours d'Essai.<br><br>
      <b>L'objectif : Lancer ton premier projet.</b><br><br>
      Ouvre le Radar des tendances pour démarrer l'analyse de ton marché.<br><br>
      À très vite,<br>
      Virgil
    `
    });

    const req = https.request(
        {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        },
        (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Mail envoyé avec succès ! Check tes emails (et le dossier Spams au cas où) !');
                } else {
                    console.error(`❌ Échec de l'envoi du mail (Statut ${res.statusCode}):`, data);
                }
            });
        }
    );

    req.on('error', (e) => {
        console.error('❌ Erreur réseau lors de la requête API Resend:', e.message);
    });

    req.write(payload);
    req.end();
}

testMail();
