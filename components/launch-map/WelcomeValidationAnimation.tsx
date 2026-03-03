'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

const VALIDATION_STEPS = [
  { label: 'Ciselage de votre marque', duration: 800 },
  { label: 'Tissage du Guide de lancement', duration: 1000 },
  { label: 'Déploiement du Studio Créatif', duration: 900 },
  { label: 'Mise au point de l\'objectif…', duration: 600 },
];

export function WelcomeValidationAnimation({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    if (stepIndex >= VALIDATION_STEPS.length) {
      onComplete?.();
      // On redirige vers le dashboard comme avant
      router.push('/dashboard?tutorial=1');
      return;
    }
    const step = VALIDATION_STEPS[stepIndex];
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / step.duration) * 100);
      setProgress(p);
      if (elapsed >= step.duration) {
        clearInterval(interval);
        setStepIndex((i) => i + 1);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [stepIndex, router, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 min-h-[320px]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">Votre marque est prête</h3>
          <p className="text-sm text-muted-foreground">
            Redirection vers le tableau de bord. Ensuite : Guide de lancement, tendances, calendrier et UGC.
          </p>
        </div>
        <div className="space-y-4">
          {VALIDATION_STEPS.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-colors ${i < stepIndex
                ? 'border-success bg-success/10'
                : i === stepIndex
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30'
                }`}
            >
              {i < stepIndex ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : i === stepIndex ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${i <= stepIndex ? 'text-foreground' : 'text-muted-foreground'
                  }`}
              >
                {step.label}
              </span>
              {i === stepIndex && (
                <div className="ml-auto w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
