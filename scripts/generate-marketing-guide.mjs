/**
 * Script de génération unique du contenu du guide marketing.
 * Chaque chapitre est généré dans un appel séparé.
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = "Tu es une API JSON ultra-précise. Tu réponds UNIQUEMENT via un JSON strict et valide. Pas de texte en dehors des balises JSON.";

const MENTOR_RULES = `RÈGLES D'OUTFITY :
- Utilise le "TU" (tutoiement) exclusivement. Bannis le "vous".
- Titres et Headings en "Sentence case" (Première lettre Majuscule, le reste en minuscules).
- Ton direct, mentor de 25 ans qui parle à un pote de 20 ans qui veut monter sa marque.
- Fais le PONT AVEC OUTFITY naturellement (ex: "C'est pour ça qu'on a créé OUTFITY", "Avec OUTFITY tu peux gagner 2 mois sur ton Tech Pack...").
- Ne mentionne aucune autre IA.
- Exemples concrets : hoodie 500gsm, made in Portugal, t-shirt boxy, etc.
- Sois TRÈS détaillé sur les conseils.`;

const CHAPTERS_META = [
  {
    number: "01",
    id: "positionnement",
    emoji: "🎯",
    title: "Le positionnement radical",
    focus: "Explique pourquoi le streetwear classique est mort et comment trouver une niche profonde. Parle d'OUTFITY pour visualiser ses idées."
  },
  {
    number: "02",
    id: "contenu",
    emoji: "📱",
    title: "Le contenu qui convertit",
    focus: "Documenter au lieu de performer. Hooks viraux. Pont avec OUTFITY pour le scripting."
  },
  {
    number: "03",
    id: "communaute",
    emoji: "🏛️",
    title: "La communauté avant la vente",
    focus: "Waitlist, VIP. Rassurer avec des Tech Packs pros via OUTFITY."
  },
  {
    number: "04",
    id: "premier-drop",
    emoji: "🚀",
    title: "Le premier drop : 0 à 1 000€",
    focus: "Teasing, urgence. Gestion prod sans stress avec OUTFITY."
  },
  {
    number: "05",
    id: "retention",
    emoji: "♻️",
    title: "La rétention et l'ambassadeur",
    focus: "Unboxing, post-achat. Qualité produit assurée via OUTFITY."
  }
];

async function generateMeta() {
  return {
    guide_title: "Faire ses premiers 1 000€ avec sa marque de vêtement",
    guide_subtitle: "Le guide sans filtre pour passer de l'idée au premier drop réussi.",
    intro: "90% des créateurs s'arrêtent avant d'avoir encaissé leur premier euro. Pourquoi ? Parce qu'ils lancent des produits sans âme pour une audience qui n'existe pas. Ici, on va t'apprendre à construire une machine de guerre marketing avec les outils qu'on a créés pour toi chez OUTFITY."
  };
}

async function generateChapter(meta) {
  const chapterPrompt = `${MENTOR_RULES}

Rédige le chapitre "${meta.number}. ${meta.title}" pour le guide.

${meta.focus}

Structure JSON strictement requise :
{
  "id": "${meta.id}",
  "number": "${meta.number}",
  "title": "${meta.title}",
  "emoji": "${meta.emoji}",
  "intro": "4-5 phrases d'intro fortes.",
  "sections": [
    {
      "heading": "Titre section",
      "body": "6-10 phrases riches avec exemples concrets et pont OUTFITY.",
      "highlight": "Phrase clé."
    },
    {
      "heading": "Titre section 2",
      "body": "6-10 phrases riches avec exemples concrets et pont OUTFITY.",
      "highlight": "Phrase clé."
    }
  ],
  "key_takeaway": "Action concrète."
}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: chapterPrompt }]
      });
      let text = resp.content.find(b => b.type === 'text')?.text ?? '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON found');
      return JSON.parse(text.substring(start, end + 1));
    } catch (err) {
      console.log(`   Attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) throw err;
    }
  }
}

async function run() {
  console.log('🚀 Démarrage de la génération...');
  const meta = await generateMeta();
  const chapters = [];
  for (const ch of CHAPTERS_META) {
    console.log(`⏳ Chapitre ${ch.number}...`);
    chapters.push(await generateChapter(ch));
  }
  const guide = { ...meta, chapters };
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'marketing-guide.json'), JSON.stringify(guide, null, 2));
  console.log('✅ Terminé !');
}

run();
