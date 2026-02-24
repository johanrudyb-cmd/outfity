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
        color: 'bg-[#007AFF]/10',
        glowColor: 'bg-[#007AFF]/5',
        iconColor: 'text-[#007AFF]',
        type: 'PDF • 45 pages',
        buttonText: 'Télécharger le Guide',
    },
    {
        category: 'Outils & Templates',
        title: 'Template Tech Pack Pro',
        description: 'Le modèle exact utilisé par les grandes marques pour communiquer avec leurs ateliers.',
        icon: FileText,
        color: 'bg-black/5',
        glowColor: 'bg-black/5',
        iconColor: 'text-[#1D1D1F]',
        type: 'Excel & PDF',
        buttonText: 'Récupérer le Template',
    },
    {
        category: 'Masterclass',
        title: 'De 0 à 10k€ avec sa marque',
        description: '45 minutes de vidéo intensive sur la stratégie marketing à adopter cette année.',
        icon: Video,
        color: 'bg-[#007AFF]/10',
        glowColor: 'bg-[#007AFF]/5',
        iconColor: 'text-[#007AFF]',
        type: 'Vidéo HD',
        buttonText: 'Regarder la Masterclass',
    },
    {
        category: 'Stratégie',
        title: 'Calendrier Editorial 365j',
        description: 'Un an de contenus programmés pour Instagram et TikTok pour ne jamais manquer d\'idées.',
        icon: Sparkles,
        color: 'bg-black/5',
        glowColor: 'bg-black/5',
        iconColor: 'text-[#1D1D1F]',
        type: 'Notion & PDF',
        buttonText: 'Accéder au Calendrier',
    }
];

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden">
            <AnimatedHeader />

            {/* Minimalist Editorial Hero Section */}
            <section className="bg-[#F5F5F7] pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden relative rounded-b-[40px] sm:rounded-b-[80px]">
                {/* Dynamic decorative blobs restricted to brand blue */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#007AFF] opacity-5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#007AFF] opacity-5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center"
                    >
                        <Badge variant="outline" className="bg-white border-[#E5E5E7] text-[#1D1D1F] px-4 py-1.5 rounded-full mb-8 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 inline-block mr-2 text-[#007AFF]" />
                            Outils & Ressources Gratuites
                        </Badge>
                        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight text-[#1D1D1F] leading-[0.9] mb-6 sm:mb-8">
                            L'accélérateur de <br />
                            <span className="text-[#007AFF]">votre réussite.</span>
                        </h1>
                        <p className="text-base sm:text-xl md:text-2xl text-[#6e6e73] max-w-2xl mx-auto font-medium leading-relaxed pb-4">
                            Des centaines de créateurs utilisent ces ressources pour concevoir, sourcer et vendre sans faire d'erreurs. <strong className="text-[#1D1D1F]">Et c'est offert.</strong>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content - Resource Grid Bento Style */}
            <section className="py-24 px-6 bg-white min-h-[50vh]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {resources.map((resource, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.4, delay: 0.1 * index, ease: "easeOut" }}
                                className="group bg-white border border-[#E5E5E7] rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 relative flex flex-col h-full"
                            >
                                {/* Subtle decorative gradient background on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F7] via-white to-white opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none z-0" />
                                <div className={`absolute -top-32 -right-32 w-64 h-64 ${resource.glowColor} blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0`} />

                                <div className="p-8 flex flex-col flex-1 relative z-10 bg-white/50 backdrop-blur-xl h-full rounded-[32px]">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-14 h-14 ${resource.color} rounded-[20px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm border border-[#F2F2F2]`}>
                                            <resource.icon className={`w-7 h-7 ${resource.iconColor}`} />
                                        </div>
                                        <Badge className="bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 transition-colors duration-300 group-hover:bg-[#1D1D1F] group-hover:text-white">
                                            OFFERT
                                        </Badge>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-1">
                                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#86868b] block`}>
                                            {resource.category}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight leading-tight group-hover:translate-x-1 transition-transform duration-300">
                                            {resource.title}
                                        </h3>
                                        <p className="text-[#6e6e73] text-sm font-medium leading-relaxed">
                                            {resource.description}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-[#F2F2F2] mt-auto">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-1.5 bg-[#F5F5F7] px-3 py-1 rounded-md">
                                                <Download className="w-3.5 h-3.5" /> {resource.type}
                                            </span>
                                        </div>
                                        <Button
                                            className={`w-full bg-[#1D1D1F] hover:bg-[#007AFF] text-white rounded-2xl h-14 shadow-md hover:shadow-xl hover:shadow-[#007AFF]/20 transition-all duration-300 font-bold text-sm tracking-wide`}
                                        >
                                            {resource.buttonText}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Instagram CTA Section - Modern Dark Card Style */}
            <section className="px-6 py-24 relative z-20 bg-white">
                <div className="max-w-4xl mx-auto pt-16 border-t border-[#F2F2F2]">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff0066]/10 to-[#cc00ff]/10 border border-[#ff0066]/20 text-[#d80056] mb-8">
                            <Instagram className="w-4 h-4" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#d80056]">Rejoindre la Communauté</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-[#1D1D1F] leading-[0.9] mb-6">
                            L'Élite du <span className="italic font-serif text-[#007AFF]">Branding</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-[#6e6e73] font-medium max-w-2xl mx-auto leading-relaxed">
                            Accède au groupe privé. Conseils, data exclusives et décryptages stratégiques chaque semaine, directement sur Instagram.
                        </p>
                    </div>

                    <div className="bg-[#1D1D1F] text-white rounded-[32px] sm:rounded-[48px] shadow-2xl shadow-black/10 overflow-hidden flex flex-col relative p-8 sm:p-12 md:p-16 border border-[#2D2D2F]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ff0066]/20 via-[#cc00ff]/10 to-transparent opacity-50 pointer-events-none blur-[80px]" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative z-10 text-center"
                        >
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight mb-12 text-white">
                                Comment accéder au <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0066] to-[#cc00ff]">Cercle Privé ?</span>
                            </h2>

                            <div className="space-y-4 sm:space-y-6 max-w-md mx-auto text-left">
                                {/* Step 1 */}
                                <div className="flex items-start gap-4 sm:gap-5 bg-white/5 p-5 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-sm hover:bg-white/10 transition-colors">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-black font-black flex items-center justify-center shrink-0 text-sm sm:text-base">1</div>
                                    <div>
                                        <h4 className="font-bold text-lg sm:text-xl text-white tracking-tight mb-1">Abonne-toi</h4>
                                        <p className="text-sm sm:text-base text-gray-400 font-medium">Rejoins <span className="text-[#ff0066] font-bold">@outfity_fr</span> sur Instagram</p>
                                    </div>
                                </div>
                                {/* Step 2 */}
                                <div className="flex items-start gap-4 sm:gap-5 bg-white/5 p-5 sm:p-6 rounded-3xl border border-[#ff0066]/30 backdrop-blur-md relative overflow-hidden group shadow-[0_0_20px_rgba(255,0,102,0.1)] hover:border-[#ff0066]/50 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff0066]/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                                    <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#ff0066] to-[#cc00ff] text-white font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,102,0.5)] text-sm sm:text-base">2</div>
                                    <div className="relative z-10">
                                        <h4 className="font-bold text-lg sm:text-xl text-white tracking-tight mb-1">Le Mot de Passe</h4>
                                        <p className="text-sm sm:text-base text-gray-400 font-medium">Envoie le mot <strong className="text-white text-base bg-white/10 px-2 py-0.5 rounded-md ml-1 tracking-widest uppercase">OUTFITY</strong> en DM.</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://instagram.com/outfity_fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-12 sm:mt-16 max-w-md mx-auto flex items-center justify-center gap-3 bg-white text-black font-black uppercase tracking-widest h-14 sm:h-16 rounded-2xl sm:rounded-full text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" /> Envoyer le DM sur Instagram
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Conversion Banner Minimalist */}
            <section className="bg-[#1D1D1F] py-32 sm:py-48 overflow-hidden relative rounded-t-[40px] sm:rounded-t-[80px]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#007AFF] blur-[200px] opacity-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <Sparkles className="w-16 h-16 text-[#007AFF] mx-auto opacity-50" />
                        <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tight">
                            PASSEZ À <br />
                            <span className="text-[#6e6e73]">L'ACTION.</span>
                        </h2>
                        <p className="text-white/60 text-lg sm:text-xl font-medium pb-2 px-4 sm:px-0">
                            Utilisez la puissance des outils qu'utilisent les professionnels pour créer, sourcer et vendre vos collections.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                            <Link href="/auth/signup">
                                <Button size="lg" className="bg-white text-black hover:bg-[#007AFF] hover:text-white rounded-full font-black uppercase tracking-widest text-xs h-14 px-10 transition-all duration-300">
                                    Lancer ma marque
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
