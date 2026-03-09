'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2, Rocket, ArrowRight, Instagram, Twitter, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface WaitlistClientProps {
    brand: any;
    settings: any;
    selectedDesign: any;
}

export function WaitlistClient({ brand, settings, selectedDesign }: WaitlistClientProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const accentColor = settings.accentColor || '#007AFF';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error("Veuillez entrer un email valide");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/waitlist/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId: brand.id,
                    designId: selectedDesign?.id,
                    email,
                    source: 'public_waitlist'
                })
            });

            if (res.ok) {
                setIsSuccess(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [accentColor, '#ffffff']
                });
                toast.success("Tu es inscrit au drop !");
            } else {
                const data = await res.json();
                toast.error(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            toast.error("Erreur de connexion");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-black selection:text-white">
            {/* Minimal Header */}
            <header className="px-6 py-8 flex items-center justify-between max-w-7xl mx-auto w-full z-50">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-black tracking-[0.2em] uppercase"
                >
                    {settings.logoUrl || brand.name}
                </motion.div>
                <div className="flex items-center gap-6">
                    <Globe className="w-5 h-5 text-black/20" />
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-24 gap-16 max-w-7xl mx-auto w-full relative">
                {/* Background Blobs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 overflow-hidden">
                    <div
                        className="absolute top-[10%] right-[10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-10 animate-pulse"
                        style={{ backgroundColor: accentColor }}
                    />
                    <div
                        className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] blur-[100px] rounded-full opacity-5"
                        style={{ backgroundColor: accentColor }}
                    />
                </div>

                {/* Left Side: Product Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full lg:w-1/2 flex items-center justify-center"
                >
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-black/5 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-full max-w-[500px] aspect-square bg-[#F5F5F7] rounded-[60px] p-12 flex items-center justify-center relative overflow-hidden shadow-2xl">
                            {selectedDesign?.productImageUrl ? (
                                <img
                                    src={selectedDesign.productImageUrl}
                                    alt="Drop Sneak Peak"
                                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                            ) : (
                                <Rocket className="w-24 h-24 text-black/5" />
                            )}

                            {/* Badges */}
                            <div className="absolute top-8 left-8">
                                <span className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5 shadow-sm">
                                    Limited Drop
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Content & Form */}
                <div className="w-full lg:w-1/2 space-y-12 z-10">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-black/5 px-4 py-1.5 rounded-full"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Dropping soon</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-5xl lg:text-7xl font-black text-[#1D1D1F] leading-[1.05] tracking-tight"
                        >
                            {settings.title || "Get ready for the next drop."}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg lg:text-xl text-[#86868B] font-medium leading-relaxed max-w-md"
                        >
                            {settings.description || "Join the list to get exclusive early access and be the first to know when we launch."}
                        </motion.p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: 0.5 }}
                                onSubmit={handleSubmit}
                                className="space-y-4 max-w-sm"
                            >
                                <div className="relative group">
                                    <div className="absolute -inset-2 bg-black/5 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-lg" />
                                    <div className="relative flex flex-col gap-3">
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full h-16 bg-[#F5F5F7] rounded-[24px] pl-14 pr-6 text-sm font-bold border-2 border-transparent focus:border-black/5 focus:bg-white transition-all outline-none"
                                            />
                                        </div>
                                        <Button
                                            disabled={isSubmitting}
                                            className="w-full h-16 rounded-[24px] text-sm font-black uppercase tracking-widest text-white shadow-xl hover:scale-102 active:scale-95 transition-all duration-300"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            {isSubmitting ? (
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Join the drop
                                                    <ArrowRight className="w-4 h-4 ml-3" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest text-center">
                                    By joining, you agree to receive drop updates.
                                </p>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#1D1D1F] text-white p-10 rounded-[40px] shadow-2xl space-y-4 max-w-sm text-center"
                            >
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">You&apos;re in the list!</h3>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">
                                    Keep an eye on your inbox. We&apos;ll send you a secret link 15 minutes before everyone else.
                                </p>
                                <div className="pt-4 flex justify-center gap-4">
                                    <Instagram className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                                    <Twitter className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Subtle Footer */}
            <footer className="px-6 py-12 border-t border-black/5 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">&copy; 2026 {brand.name}</p>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                        <a href="#" className="hover:text-black">Privacy</a>
                        <a href="#" className="hover:text-black">Terms</a>
                        <div className="flex items-center gap-2">
                            <span>Powered by</span>
                            <span className="text-black">OUTIFTY</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
