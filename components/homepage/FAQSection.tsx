'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Je n\'ai aucune expérience dans la mode. Est-ce que c\'est pour moi ?',
    answer: "Oui, c'est exactement pour toi. Outfity est conçu pour les gens qui ont une vision mais pas encore les connections ou les connaissances techniques. Les agents IA te guident étape par étape : Pharrell t'accompagne sur tes designs, Ada te guide sur le sourcing, Johan te conseille pour ta boutique. Tu n'as pas besoin de savoir coudre ou coder.",
  },
  {
    question: 'Combien ça coute vraiment pour lancer une collection avec Outfity ?',
    answer: 'La plateforme commence à 0€ (plan Starter) ou 29€/mois (plan Créateur, 3 jours gratuit). Pour la production, Ada peut trouver des fournisseurs avec des MOQ dès 30-50 pièces, soit un budget production entre 500€ et 2 000€ selon ta collection. C\'est beaucoup moins que les 3 000€+ perdus en stock invendu en faisant ça seul.',
  },
  {
    question: 'Comment le Radar TikTok marche concrètement ?',
    answer: 'Virgil analyse en continu les tendances TikTok et identifie les styles qui montent 90 jours avant qu\'ils explosent. Tu reçois une liste de niches portables (ex: gorpcore, denim baggy, cargos tech) avec leur potentiel de croissance estimé. Tu peux commander ta collection au bon moment, pas après que tout le monde l\'ait déjà fait.',
  },
  {
    question: 'Est-ce que je peux vraiment vendre avant même de produire ?',
    answer: 'Oui. Joy t\'aide à construire une waitlist avec du contenu TikTok avant ton lancement. C\'est la méthode utilisée par les marques DTC qui cartonnent : tu valides la demande avec une pre-vente ou une liste d\'attente, puis tu commandes la quantité exacte. Résultat : zéro stock mort, zéro argent perdu à l\'aveugle.',
  },
  {
    question: 'Qu\'est-ce qui se passe si je veux arrêter l\'abonnement ?',
    answer: 'Tu peux annuler à tout moment, sans engagement, sans frais. Le plan Créateur à 29€/mois est bloqué à vie si tu t\'inscris avant le 1er avril (après, le tarif reviendra à 39€/mois). Même si tu annules, tu gardes accès jusqu\'à la fin de ta période payée.',
  },
  {
    question: 'Les fournisseurs trouvés par Ada sont-ils fiables ?',
    answer: 'Ada ne te donne pas une liste aléatoire. Elle identifie des usines vérifiées avec des critères précis : délais de production, MOQ minimum, qualité des matières, retours d\'autres créateurs. Tu peux aussi lui demander de chercher selon ta localisation (Portugal, Turquie, Chine, etc.) ou tes critères de durabilité.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq-section" className="py-20 sm:py-28 bg-white relative overflow-hidden border-t border-black/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-[#007AFF]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#007AFF]">Questions fréquentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1D1D1F] uppercase tracking-tight leading-[0.92]">
            Tu te poses{' '}
            <span className="text-[#007AFF]">des questions ?</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#86868B] max-w-lg">
            Les vraies réponses, sans jargon.
          </p>
        </div>

        {/* Liste FAQ */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                'rounded-2xl border transition-all duration-300',
                openIndex === index
                  ? 'bg-white border-black/10 shadow-sm'
                  : 'bg-[#F5F5F7] border-transparent hover:border-black/5'
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between text-left gap-4"
              >
                <span className="text-sm sm:text-base font-bold text-[#1D1D1F] leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-[#86868B] shrink-0 transition-transform duration-300',
                    openIndex === index && 'rotate-180 text-[#007AFF]'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 sm:px-7 pb-5 sm:pb-6">
                  <p className="text-sm text-[#3D3D3F] font-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-[#86868B] font-medium">
            Tu as une autre question ?{' '}
            <a href="mailto:hello@outfity.fr" className="text-[#007AFF] font-bold hover:underline">
              Ecris-nous directement.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
