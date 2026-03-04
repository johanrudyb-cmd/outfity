'use client';

import { motion } from 'framer-motion';
import { Calculator, ArrowLeft } from 'lucide-react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import Footer from '@/components/homepage/Footer';
import { Badge } from '@/components/ui/badge';
import { FreeCalculator } from '@/components/community/FreeCalculator';
import Link from 'next/link';

export default function FreeCalculatorPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden flex flex-col">
            <AnimatedHeader />

            <main className="flex-1 pb-32">
                {/* Header Section */}
                <section className="relative pt-32 pb-12 px-6">
                    <div className="max-w-6xl mx-auto">
                        <Link
                            href="/communaute"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:text-[#007AFF] transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            <Badge variant="outline" className="bg-white border-[#E5E5E7] text-[#007AFF] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                Outil Gratuit
                            </Badge>
                            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1D1D1F]">
                                CALCULATEUR DE <span className="text-[#007AFF]">MARGE.</span>
                            </h1>
                            <p className="max-w-2xl text-lg text-[#86868B] font-medium leading-relaxed">
                                Le secret des marques qui durent, c'est la maîtrise des chiffres. <br className="hidden sm:block" />
                                Simule ton prochain drop et assure-toi d'être rentable dès la première vente.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Calculator Component */}
                <section className="px-6">
                    <FreeCalculator />
                </section>

                {/* Bottom Info */}
                <section className="max-w-4xl mx-auto px-6 mt-20 text-center">
                    <div className="bg-white rounded-[32px] p-10 border border-black/[0.05] shadow-sm space-y-6">
                        <h3 className="text-xl font-bold">Comment utiliser cet outil ?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
                            <div className="space-y-2">
                                <p className="text-sm font-black text-[#007AFF]">01.</p>
                                <p className="text-sm font-bold">Univers</p>
                                <p className="text-xs text-[#86868B] leading-relaxed">Choisis ton produit (Hoodie, Tshirt...) et ton niveau de gamme pour charger des moyennes du marché.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-[#007AFF]">02.</p>
                                <p className="text-sm font-bold">Simulateur</p>
                                <p className="text-xs text-[#86868B] leading-relaxed">Ajuste tes prix et tes coûts unitaires. N'oublie pas d'inclure ton budget marketing global.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-[#007AFF]">03.</p>
                                <p className="text-sm font-bold">Analyse</p>
                                <p className="text-xs text-[#86868B] leading-relaxed">Regarde ton bénéfice net et ton point mort. Si tu n'es pas rentable à 80% de ventes, revois ta stratégie.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
