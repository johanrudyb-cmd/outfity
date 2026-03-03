import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openaiApiKey = process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey,
}) : null;

export const runtime = 'nodejs';

// POST - Matching IA pour trouver l'usine idéale
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
    const { productType, quantity, budget, preferredCountry, specialties } = body;

    // Récupérer toutes les usines
    const factories = await prisma.factory.findMany({
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (factories.length === 0) {
      return NextResponse.json(
        { error: 'Aucune usine disponible' },
        { status: 404 }
      );
    }

    // Pré-filtrer les usines selon critères de base
    let filteredFactories = factories;

    if (preferredCountry) {
      filteredFactories = filteredFactories.filter(
        (f) => f.country.toLowerCase() === preferredCountry.toLowerCase()
      );
    }

    if (quantity) {
      filteredFactories = filteredFactories.filter((f) => f.moq <= quantity);
    }

    if (specialties && specialties.length > 0) {
      filteredFactories = filteredFactories.filter((f) =>
        specialties.some((s: string) =>
          f.specialties.some((spec) =>
            spec.toLowerCase().includes(s.toLowerCase())
          )
        )
      );
    }

    // Si pas de filtres ou trop peu de résultats, utiliser toutes les usines
    if (filteredFactories.length === 0) {
      filteredFactories = factories;
    }

    // Préparer les données pour l'IA
    const factoriesData = filteredFactories.map((f) => ({
      id: f.id,
      name: f.name,
      country: f.country,
      moq: f.moq,
      specialties: f.specialties,
      leadTime: f.leadTime,
      certifications: f.certifications,
      rating: f.rating,
      reviewCount: f._count.reviews,
    }));

    // Demander à l'IA de classer les usines
    const prompt = `Tu es un expert en sourcing de production textile. 
    Classe les usines suivantes par ordre de pertinence pour ce projet :
    
    Projet :
    - Type de produit : ${productType || 'Non spécifié'}
    - Quantité : ${quantity || 'Non spécifiée'}
    - Budget : ${budget ? budget + '€' : 'Non spécifié'}
    - Pays préféré : ${preferredCountry || 'Aucune préférence'}
    - Spécialités requises : ${specialties?.join(', ') || 'Aucune'}
    
    Usines disponibles :
    ${JSON.stringify(factoriesData, null, 2)}
    
    Retourne UNIQUEMENT un JSON avec un tableau "ranking" contenant les IDs des usines classées par ordre de pertinence (du plus pertinent au moins pertinent).
    Format : {"ranking": ["id1", "id2", "id3", ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en sourcing de production textile. 
          Analyse les critères du projet et classe les usines par pertinence.
          Prends en compte : MOQ, spécialités, délais, certifications, notes clients.
          Retourne UNIQUEMENT un JSON avec un tableau "ranking" des IDs classés.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    let ranking: string[] = [];
    try {
      const content = completion.choices[0]?.message?.content;
      if (content) {
        const rankingData = JSON.parse(content);
        ranking = Array.isArray(rankingData.ranking) ? rankingData.ranking : [];
      }
    } catch (parseError) {
      console.error('Erreur parsing réponse IA:', parseError);
      // En cas d'erreur, on utilise toutes les usines filtrées sans ranking
    }

    // Réorganiser les usines selon le ranking IA
    const rankedFactories = ranking
      .map((id: string) => filteredFactories.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined)
      .concat(
        filteredFactories.filter((f) => !ranking.includes(f.id))
      );

    // Limiter à 5 meilleures
    const topFactories = rankedFactories.slice(0, 5);

    return NextResponse.json({
      factories: topFactories,
      totalMatches: filteredFactories.length,
      criteria: {
        productType,
        quantity,
        budget,
        preferredCountry,
        specialties,
      },
    });
  } catch (error: any) {
    console.error('Erreur matching IA:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors du matching' },
      { status: 500 }
    );
  }
}
