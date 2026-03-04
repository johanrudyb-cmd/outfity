import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!anthropic) {
            return NextResponse.json({ error: 'Non configuré' }, { status: 500 });
        }

        const prompt = `Tu es un expert en marketing de marques de vêtements (streetwear, marques indépendantes, créateurs). 
Tu vas rédiger un guide de marketing complet, détaillé et très pratique pour des entrepreneurs débutants qui veulent lancer leur première marque de vêtements et atteindre leurs premiers 1 000€ de chiffre d'affaires.

RÈGLES IMPORTANTES :
- Le guide doit rester GÉNÉRALISTE : il enseigne des PRINCIPES universels (positionnement, contenu, communauté, lancement), jamais des outils spécifiques ou des logiciels particuliers.
- Tu peux mentionner TikTok, Instagram car ce sont des plateformes universelles.
- Ne mentionne AUCUNE IA, AUCUN logiciel de création de fiches techniques, AUCUNE appli spécifique.
- Le ton est celui d'un mentor direct, sans bullshit, qui parle à un créateur de 18-25 ans.
- Chaque chapitre doit avoir du concret : exemples réels, chiffres, erreurs communes.
- Réponds UNIQUEMENT en JSON valide, sans markdown.

Génère exactement ce JSON :
{
  "guide_title": "Titre du guide",
  "guide_subtitle": "Sous-titre accrocheur",
  "intro": "Paragraphe d'introduction fort (4-5 phrases percutantes sur la réalité du marché et pourquoi la plupart échouent)",
  "chapters": [
    {
      "id": "ch1",
      "number": "01",
      "title": "Titre du chapitre",
      "emoji": "🎯",
      "intro": "Paragraphe d'introduction du chapitre (3-4 phrases)",
      "sections": [
        {
          "heading": "Sous-titre de section",
          "body": "Corps détaillé de la section (5-8 phrases avec des exemples concrets, des erreurs à éviter, des chiffres)",
          "highlight": "Une phrase-clé à mettre en avant (la leçon principale)"
        }
      ],
      "key_takeaway": "Le conseil actionnable numéro 1 à retenir de ce chapitre"
    }
  ]
}

Les 5 chapitres doivent couvrir :
1. Le Positionnement : Comment trouver sa niche et créer une identité forte qui attire naturellement sa clientèle cible.
2. Le Contenu Organique : Comment documenter sa création de marque sur TikTok/Instagram pour bâtir une audience engagée avant même de lancer.
3. La Communauté Avant la Vente : Construire une liste d'attente, des VIP, une communauté Discord/Telegram avant le premier drop.
4. Le Premier Drop (Lancement) : La structure exacte d'un lancement réussi pour maximiser les ventes en moins de 72h.
5. L'Après-Vente & La Rétention : Comment transformer un premier acheteur en client fidèle et ambassadeur de marque.

Chaque chapitre doit avoir 2-3 sections. Sois ultra-concret, direct, avec des exemples du type "Imagine que tu lances un hoodie 500gsm..." Le guide ne doit PAS donner envie d'aller chercher des outils externes, mais de RÉFLÉCHIR et de STRUCTURER sa stratégie.`;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 8000,
            temperature: 0.7,
            system: "Tu es une API JSON. Tu réponds UNIQUEMENT via un JSON strict et valide. Jamais de texte en dehors du JSON.",
            messages: [{ role: 'user', content: prompt }]
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        let jsonText = textBlock && 'text' in textBlock ? textBlock.text : '';

        // Nettoyage au cas où Claude ajoute du Markdown
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(jsonText);
        return NextResponse.json(data, {
            headers: {
                // Cache pendant 24h (même contenu pour tout le monde, renouvelé quotidiennement)
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
            }
        });
    } catch (error: any) {
        console.error('Marketing guide generation error:', error);
        return NextResponse.json({ error: 'Erreur de génération du contenu.' }, { status: 500 });
    }
}
