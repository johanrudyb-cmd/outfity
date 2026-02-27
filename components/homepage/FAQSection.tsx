'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Quel est l\'intérêt du radar de tendances TikTok pour ma marque ?',
    answer: 'Le radar ne se contente pas de trouver des vidéos virales ; il sert avant tout à vous rassurer dans vos choix créatifs. En observant les variations du marché en temps réel pour un style précis, nous validons le potentiel d\'une pièce avant même de lancer sa production.',
  },
  {
    question: 'Comment m\'aidez-vous à sécuriser mes lancements ?',
    answer: 'Nous croisons les données d\'engagement avec les mouvements actuels du secteur. Cela vous permet de comprendre si un style est en pleine ascension ou s\'il s\'agit d\'un feu de paille, vous offrant ainsi une base factuelle pour décider vos prochaines collections.',
  },
  {
    question: 'Quels sont les outils IA inclus dans la plateforme ?',
    answer: 'Outfity propose une suite d\'outils boostés à l\'IA : générateur de logos IA, mannequin virtuel IA pour vos visuels sans shooting, et assistant script marketing IA pour vos vidéos publicitaires.',
  },
  {
    question: 'Pourquoi utiliser Outfity plutôt que de scroller TikTok soi-même ?',
    answer: 'Scroller manuellement ne donne qu\'une vision fragmentée. Nous agrégeons et structurons ces signaux pour vous donner une vue d\'ensemble cohérente de l\'évolution des styles, vous évitant de vous fier uniquement à votre intuition.',
  },
  {
    question: 'À qui s\'adresse précisément OUTFITY ?',
    answer: 'La plateforme est conçue pour les créateurs de marques de vêtements, e-commerçants et influenceurs qui veulent sécuriser leur stratégie en s\'appuyant sur des données concrètes plutôt que sur des suppositions.',
  },
  {
    question: 'La plateforme possède-t-elle un plan Starter ?',
    answer: 'Oui, vous pouvez créer un compte Starter gratuitement pour explorer la plateforme et accéder à un nombre limité de tendances et d\'outils de validation.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq-section" className="py-20 sm:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Titre */}
        <div className="mb-16 sm:mb-24 text-center">
          <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] mb-6">
            Des <span className="text-[#007AFF]">Questions ?</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-500 font-medium leading-relaxed">
            Tout ce que vous devez savoir sur l'infrastructure OUTFITY.
          </p>
        </div>

        {/* Liste de FAQ */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                'bg-[#F5F5F7] rounded-[32px] border border-[#F2F2F2]',
                'transition-all duration-300',
                openIndex === index && 'bg-white'
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between text-left"
              >
                <span className="text-lg font-bold text-[#000000] pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-[#6e6e73] flex-shrink-0 transition-transform duration-300',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
                  <p className="text-base text-[#6e6e73] font-normal leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
