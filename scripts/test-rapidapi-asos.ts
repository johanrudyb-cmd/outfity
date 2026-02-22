import axios from 'axios';
import 'dotenv/config';

/**
 * 🧪 SCRIPT DE TEST RAPIDAPI - ASOS
 * Ce script permet de vérifier la connexion à l'API ASOS via RapidAPI.
 * 
 * Pour l'utiliser :
 * 1. Créez un compte sur RapidAPI.com
 * 2. Abonnez-vous à "ASOS" (API-Dojo) - il y a un plan gratuit (Freemium).
 * 3. Ajoutez RAPIDAPI_KEY=votre_cle dans votre .env
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testAsosAPI() {
    if (!RAPIDAPI_KEY) {
        console.error('❌ ERREUR : RAPIDAPI_KEY non trouvée dans le fichier .env');
        console.log('---');
        console.log('👉 Comment obtenir votre clé :');
        console.log('1. Allez sur https://rapidapi.com/apidojo/api/asos2');
        console.log('2. Connectez-vous et abonnez-vous (Plan gratuit disponible)');
        console.log('3. Dans "Headers", récupérez la valeur de "x-rapidapi-key"');
        console.log('4. Ajoutez-la dans votre .env comme ceci : RAPIDAPI_KEY=votre_cle');
        return;
    }

    console.log('🚀 Connexion à RapidAPI (ASOS)...');

    const options = {
        method: 'GET',
        url: 'https://asos2.p.rapidapi.com/products/v2/list',
        params: {
            store: 'FR',
            offset: '0',
            categoryId: '27110', // Homme - Nouveautés vêtements
            limit: '48',
            country: 'FR',
            sort: 'freshness',
            currency: 'EUR',
            sizeSchema: 'FR',
            lang: 'fr-FR'
        },
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'asos2.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const products = response.data.products || [];

        console.log(`✅ Succès ! ${products.length} produits récupérés.`);

        if (products.length > 0) {
            console.log('\n--- EXEMPLE DE DONNÉES ---');
            const p = products[0];
            console.log(`Nom: ${p.name}`);
            console.log(`Prix: ${p.price.current.text}`);
            console.log(`Image: https://${p.imageUrl}`);
            console.log(`Marque: ${p.brandName}`);
            console.log(`URL: https://www.asos.com/${p.url}`);
            console.log('--------------------------\n');

            console.log('Ces données sont en JSON pur, pas besoin de parser du HTML !');
        }

    } catch (error: any) {
        if (error.response) {
            console.error(`❌ Erreur API (${error.response.status}):`, error.response.data.message || error.response.data);
        } else {
            console.error('❌ Erreur de connexion:', error.message);
        }
    }
}

testAsosAPI();
