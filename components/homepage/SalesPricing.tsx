'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-04-01T00:00:00');

    const calculateTime = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-bold text-[10px] sm:text-xs mb-4 bg-red-50 py-1.5 px-3 rounded-full border border-red-100">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>PRIX LANCEMENT : encore {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m</span>
    </div>
  );
}

const plans = [
  {
    name: 'Starter',
    price: 0,
    period: 'Starter',
    description: 'Pour tester la plateforme et voir si c\'est fait pour toi.',
    features: [
      'Accès aux agents Virgil et Pharrell',
      '1 scan de tendances par mois',
      'Calculateur de rentabilité',
      'Accès au Launch Map de base',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'border',
    popular: false,
  },
  {
    name: 'Créateur',
    price: 29,
    oldPrice: 39,
    period: '/mois*',
    description: 'Tout ce qu\'il te faut pour lancer ta première collection de A à Z.',
    features: [
      '3 JOURS D\'ESSAI GRATUIT',
      'Les 5 agents IA débloqués',
      'Scans de tendances illimités',
      'Accompagnement DA & Mockups',
      'Tech Pack PDF pour ton fournisseur',
      'Conseils store E-commerce avec Johan',
      'Waitlist et scripts TikTok avec Joy',
      'Accès aux fournisseurs vérifiés d\'Ada',
    ],
    cta: 'Démarrer l\'essai gratuit',
    ctaStyle: 'solid',
    popular: true,
  },
];

export default function SalesPricing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('pricing-section');
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <section id="pricing-section" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Background Decor - Abstract Shapes Instead of Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-[10%] -left-[5%] w-[40%] h-[40%] border-[20px] border-black rounded-full" />
        <div className="absolute bottom-[20%] -right-[10%] w-[35%] h-[35%] border-[1px] border-black rotate-12" />
        <div className="absolute top-[40%] left-[60%] w-[15%] h-[15%] bg-black rounded-full blur-[100px]" />
      </div>

      {/* Shapes Overlay Text */}
      <div className="absolute top-0 right-0 p-12 hidden lg:block pointer-events-none opacity-[0.05] z-0">
        <div className="text-[120px] font-black leading-none select-none text-black">OUTFITY // PRICING</div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-12 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#007AFF]/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
              <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-widest">Nos Tarifs // Lancement</span>
            </div>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-black leading-[0.9] sm:leading-[0.85] uppercase">
              Plan de <br /> <span className="text-[#007AFF]">Lancement.</span>
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* Starter Plan (Col 1-5) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            className="lg:col-span-5 p-6 sm:p-12 bg-[#F5F5F7] rounded-[32px] sm:rounded-[40px] border border-black/[0.03] relative group"
          >
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-row justify-between items-start">
                <div>
                  <h3 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 sm:mb-2">Niveau d'Accès</h3>
                  <p className="text-xl sm:text-3xl font-black text-black uppercase">Starter</p>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-3xl font-black text-black uppercase tracking-tighter">0€/mois</p>
                  <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Accès Permanent</p>
                </div>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed">
                Pour tester la plateforme et voir si c'est fait pour toi.
              </p>

              <ul className="space-y-3 sm:space-y-4">
                {plans[0].features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-gray-500">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300 rounded-full" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-4 sm:py-5 bg-white text-black border border-black/[0.1] rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Essai Découverte
              </Link>
            </div>
          </motion.div>

          {/* Creator Plan (Col 6-12) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            className="lg:col-span-7 p-6 sm:p-12 bg-black text-white rounded-[32px] sm:rounded-[40px] relative overflow-hidden shadow-2xl shadow-black/20"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#007AFF] opacity-20 blur-[80px] sm:blur-[100px]" />

            <div className="relative z-10 space-y-8 sm:space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <CountdownTimer />
                  </div>
                  <h3 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-[#007AFF] mb-1 sm:mb-2 text-left">Tout Inclus</h3>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-left">Créateur</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex flex-col items-start sm:items-end mb-2">
                    <span className="text-[8px] sm:text-[10px] font-black text-[#FF3B30] uppercase tracking-widest bg-[#FF3B30]/10 px-2 py-1 rounded-md mb-2">Au lieu de 39€</span>
                    <p className="text-3xl sm:text-4xl font-black text-white">29€</p>
                  </div>
                  <p className="text-[8px] sm:text-[10px] font-black text-white/50 uppercase tracking-widest">Par mois / À vie*</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed">
                    {plans[1].description}
                  </p>
                  <div className="flex -space-x-2 sm:-space-x-3">
                    {['virgil', 'pharrell', 'ada', 'johan', 'joy'].map(a => (
                      <img key={a} src={`/images/agents/${a}_final.webp`} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-black bg-gray-800" alt={a} />
                    ))}
                  </div>
                </div>
                <ul className="space-y-3">
                  {plans[1].features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <div className="w-1 h-1 bg-[#007AFF] rounded-full" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-5 sm:py-6 bg-[#007AFF] text-white rounded-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-xl shadow-[#007AFF]/20"
              >
                Démarrer l'essai gratuit
              </Link>
            </div>
          </motion.div>

        </div>

        <div className="mt-16 text-center border-t border-black/[0.05] pt-8">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-2xl mx-auto">
            *OFFRE LANCEMENT : 29€/MOIS À VIE SI TU T'INSCRIS AVANT LE 1ER AVRIL. SANS ENGAGEMENT, SANS CARTE REQUISE POUR L'ESSAI.
          </p>
        </div>
      </div>
    </section>
  );
}
