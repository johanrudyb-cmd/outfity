import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import OpenAI from 'openai';

const openai = process.env.CHATGPT_API_KEY
  ? new OpenAI({
      apiKey: process.env.CHATGPT_API_KEY,
    })
  : null;

// POST - Générer l'identité de marque avec IA
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'ChatGPT API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { concept, style, target } = body;

    if (!concept || concept.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le concept de marque est requis' },
        { status: 400 }
      );
    }

    // Génération des noms de marque (5 options)
    const namesCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en création de noms de marques de vêtement. 
          Génère des noms créatifs, mémorables et adaptés au marché français.
          Les noms doivent être courts (1-3 mots), faciles à prononcer et disponibles potentiellement en .com/.fr.
          Retourne UNIQUEMENT un JSON avec un tableau "names" contenant 5 noms de marque.`,
        },
        {
          role: 'user',
          content: `Concept de marque : "${concept}"
          ${style ? `Style : ${style}` : ''}
          ${target ? `Public cible : ${target}` : ''}
          
          Génère 5 noms de marque créatifs et mémorables pour ce concept.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    const namesData = JSON.parse(namesCompletion.choices[0]?.message?.content || '{"names": []}');
    const names = namesData.names || [];

    // Génération de la palette de couleurs
    const colorsCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en identité visuelle et palettes de couleurs pour marques de vêtement.
          Génère une palette de couleurs cohérente avec le concept de marque.
          Retourne UNIQUEMENT un JSON avec un objet "colorPalette" contenant : primary, secondary, accent (codes hexadécimaux).
          Les couleurs doivent être modernes, adaptées au secteur mode et cohérentes entre elles.`,
        },
        {
          role: 'user',
          content: `Concept : "${concept}"
          ${style ? `Style : ${style}` : ''}
          
          Génère une palette de 3 couleurs (primary, secondary, accent) en codes hex (#RRGGBB).`,
        },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
      max_tokens: 150,
    });

    const colorsData = JSON.parse(colorsCompletion.choices[0]?.message?.content || '{"colorPalette": {}}');
    const colorPalette = colorsData.colorPalette || {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#6366F1',
    };

    // Génération de la typographie
    const typographyCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en typographie pour marques de vêtement.
          Recommande des polices Google Fonts adaptées au concept.
          Retourne UNIQUEMENT un JSON avec un objet "typography" contenant : heading (police pour titres), body (police pour texte).
          Les polices doivent être modernes, lisibles et adaptées au secteur mode.`,
        },
        {
          role: 'user',
          content: `Concept : "${concept}"
          ${style ? `Style : ${style}` : ''}
          
          Recommande 2 polices Google Fonts (heading et body) adaptées à ce concept.`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
      max_tokens: 100,
    });

    const typographyData = JSON.parse(typographyCompletion.choices[0]?.message?.content || '{"typography": {}}');
    const typography = typographyData.typography || {
      heading: 'Inter',
      body: 'Inter',
    };

    // Génération des logos avec DALL-E (3 options)
    const logos: string[] = [];
    const logoPrompts: string[] = [];

    // Créer des prompts pour chaque nom généré (on prend les 3 premiers)
    for (let i = 0; i < Math.min(3, names.length); i++) {
      const logoPrompt = `Logo minimaliste et moderne pour la marque "${names[i]}", style ${style || 'contemporain'}, 
      palette de couleurs ${colorPalette.primary}, ${colorPalette.secondary}, ${colorPalette.accent}, 
      design épuré, adapté pour marque de vêtement, vectoriel, fond transparent`;
      
      logoPrompts.push(logoPrompt);
    }

    // Générer les logos avec DALL-E
    try {
      for (const prompt of logoPrompts) {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        if (imageUrl) {
          logos.push(imageUrl);
        }
      }
    } catch (logoError) {
      console.warn('Erreur génération logos DALL-E, continuation sans logos:', logoError);
      // On continue sans logos si DALL-E échoue
    }

    return NextResponse.json({
      names: names.slice(0, 5), // Maximum 5 noms
      logos: logos, // 0-3 logos selon succès DALL-E
      colorPalette,
      typography,
    });
  } catch (error: any) {
    console.error('Error generating brand identity:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de l\'identité' },
      { status: 500 }
    );
  }
}
