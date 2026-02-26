import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { isPaidPlan } from '@/lib/plan-utils';

export const dynamic = 'force-dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Sparkles, TrendingUp, Users, Copy, ArrowUpRight, Play, Mic, Menu, MessageSquare } from 'lucide-react';

const DAILY_SCRIPTS = [
    {
        id: 1,
        title: "Le Hook Contre-Intuitif",
        type: "Viral",
        duration: "15s",
        difficulty: "Facile",
        hook: "Arrêtez d'acheter des vêtements de marque.",
        body: "Pourquoi payer 60€ pour un T-shirt que vous pouvez produire pour 12€ ? Avec OUTFITY, j'ai créé ma propre ligne en 24h. C'est la même usine que [Marque Connue], mais c'est MON logo.",
        cta: "Cliquez sur le lien en bio pour lancer VOTRE marque.",
        visual: "Montrez votre T-shirt, puis l'écran OUTFITY avec le prix de production."
    },
    {
        id: 2,
        title: "Behind The Scenes : Sourcing",
        type: "Éducatif",
        duration: "30s",
        difficulty: "Moyen",
        hook: "Comment je trouve mes usines au Portugal sans bouger de chez moi.",
        body: "Avant, je passais des heures sur Alibaba. Maintenant, j'utilise le Sourcing Hub OUTFITY. Regardez : je filtre par 'Coton Bio', 'Europe', et boum : 3 usines vérifiées avec les certificats.",
        cta: "Essayez le Sourcing Hub gratuitement (lien en bio).",
        visual: "Capture d'écran de la carte des usines sur OUTFITY."
    },
    {
        id: 3,
        title: "Analyse Tendance : Y2K",
        type: "Trend Surf",
        duration: "20s",
        difficulty: "Facile",
        hook: "Cette coupe de pantalon va exploser en 2026.",
        body: "Le Radar OUTFITY vient de détecter une hausse de 400% sur les pantalons Cargo Parachute. Si vous voulez lancer une marque Streetwear, c'est LE produit à sortir maintenant.",
        cta: "Abonnez-vous pour plus d'astuces tendances.",
        visual: "Montrez le graphique de tendance du Radar OUTFITY."
    }
];

export default async function AcademyPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin?callbackUrl=/academy');
    }

    // Vérification des droits d'accès
    if (!isPaidPlan(user.plan)) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white">
            {/* Mobile-First Header */}
            <header className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold tracking-wider">GROWTH.AI</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold border border-white/5">
                        🔥 Hot Streak: 3 Jours
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </header>

            <main className="max-w-md mx-auto pb-24 pt-6 px-4">

                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Bonjour, {user.name?.split(' ')[0]} 👋</h1>
                    <p className="text-white/60 text-sm">Prêt à percer ? Voici vos missions du jour.</p>
                </div>

                {/* Daily Progress */}
                <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-purple-200">Objectif Hebdo</span>
                        <span className="text-sm font-bold text-white">2/5 Vidéos</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-[40%]" />
                    </div>
                </div>

                {/* Scripts Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Video className="w-4 h-4 text-purple-400" />
                            Scripts du Jour
                        </h2>
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">IA v2.4</span>
                    </div>

                    {DAILY_SCRIPTS.map((script, index) => (
                        <div key={script.id} className="relative group perspective">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
                            <Card className="relative bg-neutral-900 border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
                                <CardContent className="p-5">
                                    {/* Badges */}
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-500/20">
                                            {script.type}
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 text-white/60 text-[10px] font-medium rounded border border-white/5">
                                            {script.duration}
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 text-white/60 text-[10px] font-medium rounded border border-white/5">
                                            {script.difficulty}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-4 leading-tight">
                                        "{script.title}"
                                    </h3>

                                    {/* Script Body */}
                                    <div className="space-y-4 mb-6">
                                        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                            <span className="text-xs text-purple-400 font-bold uppercase block mb-1">🪝 LE HOOK</span>
                                            <p className="text-white text-sm font-medium">"{script.hook}"</p>
                                        </div>
                                        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                            <span className="text-xs text-blue-400 font-bold uppercase block mb-1">🗣️ LE CORPS</span>
                                            <p className="text-white/80 text-sm leading-relaxed">"{script.body}"</p>
                                        </div>
                                        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                            <span className="text-xs text-green-400 font-bold uppercase block mb-1">⚡️ LE CTA</span>
                                            <p className="text-white text-sm font-medium">"{script.cta}"</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button className="bg-white text-black hover:bg-white/90 font-bold w-full">
                                            <Copy className="w-4 h-4 mr-2" /> Copier
                                        </Button>
                                        <Button className="bg-purple-600 text-white hover:bg-purple-700 font-bold w-full border border-purple-500">
                                            <Mic className="w-4 h-4 mr-2" /> Téléprompteur
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Floating AI Chat Button */}
                <div className="fixed bottom-6 right-6 z-50">
                    <Button className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-xl border-2 border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </Button>
                </div>

            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full bg-black/90 backdrop-blur-lg border-t border-white/10 h-16 flex items-center justify-around px-2 z-40 max-w-md left-1/2 -translate-x-1/2 rounded-t-2xl sm:max-w-full sm:rounded-none">
                <Button variant="ghost" className="flex flex-col items-center gap-1 h-full w-full text-purple-400 hover:text-purple-300 hover:bg-transparent">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Missions</span>
                </Button>
                <Button variant="ghost" className="flex flex-col items-center gap-1 h-full w-full text-white/40 hover:text-white hover:bg-transparent">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Analyse</span>
                </Button>
                <Button variant="ghost" className="flex flex-col items-center gap-1 h-full w-full text-white/40 hover:text-white hover:bg-transparent">
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Communauté</span>
                </Button>
            </nav>
        </div>
    );
}
