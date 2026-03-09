'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, ScanLine, CheckCircle2, AlertTriangle, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';

interface PhaseScannerProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete: () => void;
    userPlan?: string;
}

export function PhaseScanner({ brandId, brand, onComplete, userPlan }: PhaseScannerProps) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ score: number; passed: boolean; feedback: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('brandId', brandId);
            const res = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Erreur d'import");
            const data = await res.json();
            setFileUrl(data.url);
            setScanResult(null); // Reset scan if new file
        } catch (err) {
            alert("Erreur lors de l'import");
        } finally {
            setIsUploading(false);
        }
    };

    const startScan = async () => {
        if (!fileUrl) return;
        setIsScanning(true);

        try {
            // 1. Fetch the image and convert it to base64
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const base64Image = await base64Promise;

            // 2. Call the real Radar API
            const res = await fetch('/api/trends/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'NOT_CLOTHING') {
                    alert(data.message || "Le scanner n'a pas détecté de vêtement.");
                } else {
                    alert(data.error || "Erreur lors de l'analyse");
                }
                setIsScanning(false);
                return;
            }

            const analysis = data.analysis;

            // 3. Map real API data to our UI
            setScanResult({
                score: analysis.trendScore,
                passed: analysis.trendScore >= 70,
                feedback: [
                    `Style détecté : ${analysis.style} (${analysis.category})`,
                    analysis.recommendation || "Le design montre un potentiel intéressant sur les segments ciblés.",
                    analysis.why || "Analyse basée sur les signaux faibles TikTok et Zalando du moment."
                ]
            });
        } catch (err) {
            console.error("Scan error:", err);
            alert("Une erreur est survenue lors du scan.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-y-auto p-6 sm:p-12">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/launch-map"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour
                        </Link>
                    </div>

                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl mx-auto flex items-center justify-center">
                            <ScanLine className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black text-[#1D1D1F]">Scanner Viral</h2>
                        <p className="text-[#86868B] text-lg">
                            Avant de produire quoi que ce soit, passons ton design au radar.
                            Si le potentiel viral est faible, on ajuste. S'il est fort, on fonce.
                        </p>
                    </div>

                    {!fileUrl && (
                        <div
                            className="border-2 border-dashed border-black/10 rounded-[32px] p-12 text-center cursor-pointer hover:bg-black/5 hover:border-black/30 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadFile(f);
                                }}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                    <p className="font-bold">Téléchargement en cours...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-[#1D1D1F]">Importe ton Mockup</p>
                                        <p className="text-sm text-muted-foreground">PNG, JPG (Max 5MB)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {fileUrl && !scanResult && (
                        <div className="space-y-6">
                            <div className="relative rounded-[32px] overflow-hidden bg-black/5 aspect-square max-w-sm mx-auto p-4 flex items-center justify-center">
                                <img src={fileUrl} alt="Mockup" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                {isScanning && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center flex-col gap-4">
                                        <ScanLine className="w-16 h-16 text-primary animate-pulse" />
                                        <p className="text-primary font-bold tracking-widest uppercase text-sm animate-pulse">Analyse en cours...</p>
                                    </div>
                                )}
                            </div>

                            {!isScanning && (
                                <div className="flex justify-center gap-4">
                                    <Button variant="outline" onClick={() => setFileUrl(null)}>Changer l'image</Button>
                                    <Button onClick={startScan} className="shadow-lg shadow-primary/30 gap-2">
                                        <ScanLine className="w-4 h-4" />
                                        Lancer le Scan
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {scanResult && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative rounded-[32px] overflow-hidden bg-black/5 aspect-video max-w-sm mx-auto flex items-center justify-center">
                                <img src={fileUrl!} alt="Mockup" className="max-w-full max-h-full object-contain mix-blend-multiply opacity-50" />
                                <div className="absolute flex flex-col items-center">
                                    <div className="text-6xl font-black text-[#1D1D1F] drop-shadow-lg">{scanResult.score}<span className="text-2xl text-[#86868B]">/100</span></div>
                                    <div className={cn("mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-md", scanResult.passed ? "bg-green-500" : "bg-red-500")}>
                                        {scanResult.passed ? 'Feu Vert' : 'Ajustements Requis'}
                                    </div>
                                </div>
                            </div>

                            <Card className="bg-white border-black/10 shadow-apple-sm">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="font-bold text-lg flex items-center gap-2">
                                        {scanResult.passed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                        Retour du Radar
                                    </h4>
                                    <ul className="space-y-3">
                                        {scanResult.feedback.map((fb, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm text-[#86868B] bg-black/5 p-3 rounded-xl">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                <span>{fb}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {scanResult.passed && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        size="lg"
                                        onClick={onComplete}
                                        className="w-full sm:w-auto text-sm font-bold shadow-lg shadow-primary/30"
                                    >
                                        Passer à la Communication
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
