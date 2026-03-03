
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openaiApiKey = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({
    apiKey: openaiApiKey,
}) : null;

export async function POST(request: Request) {
    try {
        if (!openai) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }
        const { segment, category, subFilter, currentScore, futureScore, leadTime, isOffSeason, styles } = await request.json();

        const prompt = `
      Tu es un expert en analyse de tendances mode pour une marque premium française.
      Analyse les données suivantes et donne des conseils stratégiques précis.
      
      DONNÉES DU MARCHÉ :
      - Segment : ${segment}
      - Catégorie : ${category}
      - Style spécifique actuel : ${subFilter}
      - Score actuel (Live) : ${currentScore} pts
      - Score projeté dans ${leadTime} jours (Date de sortie) : ${futureScore} pts
      - Est hors-saison : ${isOffSeason ? 'OUI' : 'NON'}
      - Nombre de styles détectés : ${styles?.length || 0}
      
      OBJECTIF :
      1. Rédige un commentaire court (2-3 phrases) et très pro sur l'opportunité de lancement.
      2. Définis une fourchette de prix de vente conseillée (min et max en euros).
      3. Identifie 3 couleurs virales spécifiques à ce segment et cette saison pour ce produit.
      4. Détermine un niveau de recommandation (OPTIMAL, PRUDENT ou RISQUE).

      Réponds UNIQUEMENT au format JSON comme ceci :
      {
        "commentary": "...",
        "priceRange": { "min": 50, "max": 80 },
        "colors": [
          { "hex": "#...", "name": "..." },
          { "hex": "#...", "name": "..." },
          { "hex": "#...", "name": "..." }
        ],
        "recommendationLevel": "..."
      }
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Tu es un expert data-analyst mode de luxe." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return NextResponse.json(result);

    } catch (error) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
    }
}
