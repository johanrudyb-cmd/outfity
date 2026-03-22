'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Karim S.',
    role: 'Fondateur · Streetwear Paris',
    rating: 5,
    avatar: 'K',
    color: '#007AFF',
    highlight: 'Fournisseur chinois trouvé en 3 jours',
    text: 'Je cherchais une usine depuis 4 mois sans résultats. Avec Ada sur Outfity, j\'avais 3 devis de fournisseurs portugais en 3 jours. Mon premier drop de 60 hoodies s\'est vendu à 90% en 2 semaines.',
  },
  {
    name: 'Léa M.',
    role: 'Créatrice · Mode féminine Lyon',
    rating: 5,
    avatar: 'L',
    color: '#A032FF',
    highlight: '312 personnes en waitlist avant le lancement',
    text: 'Joy m\'a aidé à créer mes scripts TikTok pour la waitlist. En 10 jours, 312 personnes inscrites. Le jour du drop, j\'ai vendu pour 2 800€ en 48h. Sans avoir eu à payer un seul influenceur.',
  },
  {
    name: 'Nabil T.',
    role: 'Designer · Workwear Bordeaux',
    rating: 5,
    avatar: 'N',
    color: '#30D158',
    highlight: 'Tech pack professionnel en 1 soirée',
    text: 'Avant j\'envoyais des sketches au crayon à mes fournisseurs et ils ne comprenaient pas. Pharrell m\'a guidé pour faire un vrai tech pack en une soirée. L\'usine a dit que c\'était le brief le plus clair qu\'ils avaient reçu.',
  },
  {
    name: 'Sarah B.',
    role: 'Fondatrice · Essentials Nantes',
    rating: 5,
    avatar: 'S',
    color: '#FF9500',
    highlight: 'Tendance identifiée 3 mois avant tout le monde',
    text: 'Virgil m\'a signalé le boom du gorpcore 3 mois avant qu\'il explose sur TikTok. J\'ai lancé ma collection outdoor au bon moment. Résultat : complet en 3 semaines. Mes concurrents arrivent avec leur stock maintenant.',
  },
  {
    name: 'Theo R.',
    role: 'Créateur · Denim Custom Lille',
    rating: 5,
    avatar: 'T',
    color: '#FF2A5F',
    highlight: 'Boutique Shopify prête en 48h',
    text: 'Johan a configuré toute ma boutique Shopify, les fiches produits, les emails automatiques, tout. En 2 jours c\'était en ligne. Avant j\'avais un Notion avec mes prix et je vendais par message privé Instagram.',
  },
  {
    name: 'Imane D.',
    role: 'Designer · Modestfashion',
    rating: 5,
    avatar: 'I',
    color: '#5856D6',
    highlight: 'MOQ de 30 pièces négocié avec une usine turque',
    text: 'J\'avais 800€ de budget, je pensais que c\'était impossible de lancer. Ada a trouvé une usine en Turquie qui acceptait 30 pièces minimum. Aujourd\'hui j\'ai vendu les 30, je recommande 80. Ca a vraiment démarré.',
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="testimonials-section" className="py-20 sm:py-28 bg-[#F5F5F7] relative overflow-hidden border-t border-black/5">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-[#007AFF]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#007AFF]">Ils ont lancé leur marque</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1D1D1F] uppercase tracking-tight leading-[0.92]">
            Leurs premiers drops,{' '}
            <span className="text-[#007AFF]">en vrai.</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#86868B] max-w-lg">
            Des créateurs comme toi, qui ont lancé leur premiere collection avec Outfity.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.06] hover:shadow-lg hover:shadow-black/5 hover:border-black/10 transition-all duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="w-3.5 h-3.5 fill-[#1D1D1F] text-[#1D1D1F]" />
                ))}
              </div>

              {/* Highlight badge */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] mb-4 w-fit"
                style={{ color: t.color, backgroundColor: `${t.color}12`, border: `1px solid ${t.color}25` }}
              >
                {t.highlight}
              </div>

              {/* Text */}
              <p className="text-sm text-[#3D3D3F] leading-relaxed font-medium flex-1 mb-5">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-black text-[#1D1D1F]">{t.name}</p>
                  <p className="text-[10px] text-[#86868B] font-medium">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social proof bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {[
            { value: '4.9/5', label: 'Note moyenne' },
            { value: '+180', label: 'Créateurs actifs' },
            { value: '73%', label: 'Vendent dès le 1er drop' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl sm:text-2xl font-black text-[#1D1D1F]">{value}</p>
              <p className="text-[10px] text-[#86868B] font-medium uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

