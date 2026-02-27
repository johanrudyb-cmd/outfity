'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, FileText, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const benefits = [
    {
        title: "Radar de Tendances",
        description: "Anticipez le marché TikTok en identifiant les futurs best-sellers 3 mois à l'avance. Évitez de produire des modèles sans potentiel de viralité.",
        stat: "-95%",
        subStat: "Effort d'analyse",
        icon: Zap,
        color: "#007AFF"
    },
    {
        title: "Marketing Viral",
        description: "Laissez nos agents IA piloter votre communication. Créez des campagnes de contenu à fort impact guidées par les meilleures stratégies marketing, sans avoir besoin d'une équipe dédiée.",
        stat: "0€",
        subStat: "Frais d'agence",
        icon: Zap,
        color: "#A032FF"
    },
    {
        title: "Tech Pack & Sourcing",
        description: "Générez vos dossiers techniques pros et accédez à notre base de fournisseurs. Éliminez les erreurs de production et sécurisez vos marges.",
        stat: "-60%",
        subStat: "Risques & Coûts",
        icon: TrendingDown,
        color: "#FF3B30"
    }
];

export default function EfficiencyShowcase() {
    return (
        <section className="py-16 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#007AFF]/5 rounded-full blur-[80px] sm:blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="flex flex-col items-center text-center mb-12 sm:mb-16 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-[#007AFF]/10 rounded-full mb-6 border border-[#007AFF]/10 shadow-sm"
                    >
                        <ShieldCheck className="w-3 h-3 text-[#007AFF]" />
                        <span className="text-[8px] sm:text-[9px] font-black text-[#007AFF] uppercase tracking-[0.2em]">Infrastructure d&apos;Analyse // Analyse Data</span>
                    </motion.div>

                    <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-[0.95] sm:leading-[0.9] max-w-4xl">
                        Maximisez votre impact. <br />
                        <span className="text-[#007AFF]">Minimisez vos coûts.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {benefits.map((benefit, idx) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.6 }}
                            whileHover={{ y: -5 }}
                            className={cn("group relative h-full", idx === 2 && "sm:col-span-2 lg:col-span-1")}
                        >
                            <div className="h-full bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border border-black/[0.03] shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-500 group-hover:shadow-[0_15px_40px_rgba(0,122,255,0.06)] group-hover:border-[#007AFF]/20 flex flex-col items-start relative z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#007AFF]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-black/5 transition-all duration-500">
                                    <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500 group-hover:scale-110" style={{ color: benefit.color }} />
                                </div>
                                <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-black leading-none">{benefit.title}</h3>
                                    <p className="text-gray-500 text-[11px] sm:text-xs font-medium leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                                <div className="mt-auto w-full">
                                    <div className="h-[1px] w-full bg-black/5 mb-5 sm:mb-6" />
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl sm:text-4xl font-black tracking-tighter text-black tabular-nums group-hover:text-[#007AFF] transition-colors">{benefit.stat}</div>
                                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#007AFF] mt-1">{benefit.subStat}</div>
                                        </div>
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all duration-500">
                                            <div className="w-1 h-1 rounded-full bg-black group-hover:bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-3 -right-3 text-[60px] sm:text-[80px] font-black text-black/[0.02] select-none pointer-events-none group-hover:text-[#007AFF]/[0.03] transition-colors duration-700">
                                {idx + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="flex -space-x-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative">
                                <img src="/creator_avatar_1_1772154742456.png" alt="C1" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative">
                                <img src="/creator_avatar_2_1772154754566.png" alt="C2" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative">
                                <img src="/creator_avatar_3_1772154767575.png" alt="C3" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative">
                                <img src="/creator_avatar_4_1772154780040.png" alt="C4" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">+150 créateurs actifs</p>
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Performance moyenne</div>
                        <div className="h-1 sm:h-1.5 w-full sm:w-32 bg-[#F5F5F7] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#007AFF]"
                                initial={{ width: 0 }}
                                whileInView={{ width: '85%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
