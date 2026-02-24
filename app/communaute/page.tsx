'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    BookOpen,
    FileText,
    Video,
    Download,
    Sparkles,
    Instagram,
    ChevronRight,
    Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { Footer } from '@/components/homepage/Footer';

const resources = [
    {
        category: 'Ebooks & Guides',
        title: 'Le Guide du Sourcing 2026',
        description: 'Apprenez à trouver et négocier avec les meilleures usines sans vous faire avoir.',
        icon: BookOpen,
        color: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        type: 'PDF • 45 pages',
        buttonText: 'Télécharger le Guide',
    },
    {
        category: 'Outils & Templates',
        title: 'Template Tech Pack Pro',
        description: 'Le modèle exact utilisé par les grandes marques pour communiquer avec leurs ateliers.',
        icon: FileText,
        color: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        type: 'Excel & PDF',
        buttonText: 'Récupérer le Template',
    },
    {
        category: 'Masterclass',
        title: 'De 0 à 10k€ avec sa marque',
        description: '45 minutes de vidéo intensive sur la stratégie marketing à adopter cette année.',
        icon: Video,
        color: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        type: 'Vidéo HD',
        buttonText: 'Regarder la Masterclass',
    },
    {
        category: 'Stratégie',
        title: 'Calendrier Editorial 365j',
        description: 'Un an de contenus programmés pour Instagram et TikTok pour ne jamais manquer d\'idées.',
        icon: Sparkles,
        color: 'bg-orange-500/10',
        iconColor: 'text-orange-500',
        type: 'Notion & PDF',
        buttonText: 'Accéder au Calendrier',
    }
];

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden">
            <AnimatedHeader />

            {/* Hero Section - Focused on Resources */}
            <section className="relative pt-32 pb-16 px-6 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.05)_0,transparent_50%)]" />

                <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge variant="outline" className="bg-white/50 border-[#007AFF]/20 text-[#007AFF] px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest">
                            Outils & Ressources Gratuites
                        </Badge>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[#1D1D1F] leading-[0.9] mb-6">
                            L'accélérateur de <br />
                            <span className="text-[#007AFF]">marques de demain.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-[#86868b] max-w-2xl mx-auto font-medium leading-relaxed">
                            Nous mettons à votre disposition les meilleurs outils et ressources pour lancer et scaler votre marque de vêtement. Gratuitement.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content - Resource Grid (Moved to the top) */}
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {resources.map((resource, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 * index }}
                                className="group bg-white rounded-[32px] p-8 border border-[#F2F2F2] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
                            >
                                <div className="absolute top-6 right-6">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">OFFERT</Badge>
                                </div>
                                <div className={`w-14 h-14 ${resource.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                    <resource.icon className={`w-7 h-7 ${resource.iconColor}`} />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-1 block">
                                            {resource.category}
                                        </span>
                                        <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">
                                            {resource.title}
                                        </h3>
                                    </div>

                                    <p className="text-[#6e6e73] text-sm leading-relaxed min-h-[60px]">
                                        {resource.description}
                                    </p>

                                    <div className="pt-4 flex flex-col gap-4">
                                        <span className="text-xs font-medium text-[#86868b] flex items-center gap-2">
                                            <Download className="w-3 h-3" /> {resource.type}
                                        </span>
                                        <Button
                                            className="w-full bg-[#f2f2f7] hover:bg-[#007AFF] text-[#1D1D1F] hover:text-white rounded-xl shadow-none transition-all duration-300 font-bold"
                                        >
                                            {resource.buttonText}
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Instagram CTA Section (Moved below as secondary feature) */}
            <section className="px-6 py-24 relative z-20 mt-12 bg-white border-t border-[#F2F2F2]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff0066]/10 to-[#cc00ff]/10 border border-[#ff0066]/40 text-[#d80056] mb-6">
                            <Instagram className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#d80056]">Rejoindre la Communauté</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-[#1D1D1F] mb-4">
                            L'Élite du Branding.
                        </h2>
                        <p className="text-lg text-[#6e6e73] max-w-2xl mx-auto">
                            Accède au groupe privé. Conseils, data exclusifs et décryptages stratégiques chaque semaine, directement sur Instagram.
                        </p>
                    </div>

                    <div className="bg-black text-white rounded-[40px] border border-[#F2F2F2] shadow-2xl shadow-black/5 overflow-hidden flex flex-col relative p-10 md:p-16">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#ff0066]/20 to-transparent opacity-50 pointer-events-none" />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative z-10 text-center"
                        >
                            <h2 className="text-3xl md:text-5xl font-black leading-none tracking-tight mb-12 text-white">
                                Comment accéder au <br />
                                <span className="text-[#ff0066]">Cercle Privé ?</span>
                            </h2>

                            <div className="space-y-6 max-w-md mx-auto text-left">
                                <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white">Abonne-toi</h4>
                                        <p className="text-sm text-gray-300">Rejoins <span className="text-[#ff0066] font-bold">@outfity_fr</span> sur Instagram</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-[#ff0066]/30 backdrop-blur-sm relative overflow-hidden group shadow-[0_0_15px_rgba(255,0,102,0.1)]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff0066]/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff0066] to-[#cc00ff] text-white font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,102,0.5)]">2</div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white">Le Mot de Passe</h4>
                                        <p className="text-sm text-gray-300">Envoie le mot <strong className="text-white text-base">"OUTFITY"</strong> en DM.</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://instagram.com/outfity_fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-12 max-w-md mx-auto flex items-center justify-center gap-3 bg-white text-black font-black uppercase tracking-widest py-5 rounded-2xl text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.25)]"
                            >
                                <Send className="w-4 h-4" /> Envoyer le DM sur Instagram
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Conversion Banner */}
            <section className="bg-[#1D1D1F] py-24 px-6 text-center text-white">
                <div className="max-w-4xl mx-auto space-y-10">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
                        Prêt à transformer vos <br />idées en réalité ?
                    </h2>
                    <p className="text-xl text-gray-300 font-medium max-w-xl mx-auto">
                        Utilisez les outils qu'utilisent les professionnels pour créer, sourcer et vendre vos collections.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
                        <Link href="/auth/signup">
                            <Button size="lg" className="bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold h-16 px-12 text-lg rounded-full shadow-[0_0_50px_rgba(0,122,255,0.4)] transition-all transform hover:-translate-y-1">
                                Lancer ma marque maintenant
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
