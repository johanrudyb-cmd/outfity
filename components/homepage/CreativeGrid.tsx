'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Image, FileText, Palette, Calculator, Camera } from 'lucide-react';

import { motion } from 'framer-motion';

export function CreativeGrid() {
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
    const element = document.getElementById('creative-grid');
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <section id="creative-grid" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Design Editor Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-10 left-10 w-40 h-40 border border-black rounded-full" />
        <div className="absolute bottom-20 right-20 w-80 h-80 border border-black rotate-45" />
        <div className="absolute top-1/2 left-1/4 w-px h-64 bg-black" />
        <div className="absolute top-1/4 right-1/3 w-64 h-px bg-black" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-end justify-between mb-16 underline-offset-8">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">Atelier Créatif // Illimité</span>
            </motion.div>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-none">
              Libérez votre <br /> <span className="text-[#007AFF]">Créativité.</span>
            </h2>
          </div>
          <p className="text-gray-400 font-medium max-w-sm lg:text-right leading-relaxed">
            Des outils de pointe pour transformer vos idées en actifs visuels haute fidélité en quelques secondes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px]">
          {/* Main Studio Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-8 relative group rounded-[40px] overflow-hidden bg-[#007AFF] p-10 lg:p-16 flex flex-col justify-between text-white shadow-2xl shadow-[#007AFF]/20"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10 -skew-x-12 translate-x-1/4 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 border border-white/30">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase mb-6 leading-none">
                Shooting <br /> Virtuel IA.
              </h3>
              <p className="text-white/80 text-lg max-w-md font-medium leading-relaxed">
                Plus besoin d'organiser des séances coûteuses. Notre studio simule des éclairages et des textures réelles pour vos produits.
              </p>
            </div>

            <Link href="#pricing-section" className="relative z-10 w-fit flex items-center gap-4 px-8 py-4 bg-white text-[#007AFF] rounded-full text-sm font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all group">
              Entrer dans le Studio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Decorative Floating Label */}
            <div className="absolute bottom-10 right-10 hidden lg:block">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em] rotate-90 origin-bottom-right">QUALITÉ PROFESSIONNELLE</span>
            </div>
          </motion.div>

          {/* Side Utility Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Logo Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="flex-1 group bg-[#F5F5F7] rounded-[32px] p-8 border border-black/[0.03] hover:border-[#007AFF]/20 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                  <Palette className="w-6 h-6 text-[#007AFF]" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-black mb-2">Créateur de Logo</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Générez une identité visuelle unique et vectorisée en un instant.</p>
              </div>
              <div className="absolute bottom-8 right-8 text-[#007AFF] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="flex-1 group bg-black rounded-[32px] p-8 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-white mb-2">Contenu Viral</h4>
                <p className="text-xs text-white/50 font-medium leading-relaxed">Scripts haute conversion pour TikTok & Instagram déclinés par votre DA.</p>
              </div>
              <div className="absolute bottom-8 right-8 text-white opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="w-6 h-6" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

