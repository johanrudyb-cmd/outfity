'use client';

import { AlertTriangle, Sparkles, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SubscriptionWarningProps {
    context: 'downgrade' | 'cancel' | 'upgrade';
    brandName?: string;
    templateBrand?: string;
}

export function SubscriptionWarning({ context, brandName, templateBrand }: SubscriptionWarningProps) {
    const warnings = {
        downgrade: {
            title: '⚠️ Attention : Perte d\'accès à vos stratégies',
            icon: AlertTriangle,
            items: [
                {
                    icon: Lock,
                    title: 'Stratégie calquée perdue',
                    description: templateBrand
                        ? `Votre stratégie basée sur ${templateBrand} ne sera plus accessible`
                        : 'Toutes vos stratégies calquées sur des marques de référence seront verrouillées',
                },
                {
                    icon: Sparkles,
                    title: 'Mises à jour IA désactivées',
                    description: 'Votre stratégie ne sera plus mise à jour automatiquement en fonction des actualités et tendances de votre secteur',
                },
                {
                    icon: TrendingUp,
                    title: 'Analyses de marché limitées',
                    description: 'Retour à 3 analyses de tendances par mois maximum',
                },
            ],
        },
        cancel: {
            title: '🚨 Vous allez perdre l\'accès à :',
            icon: AlertTriangle,
            items: [
                {
                    icon: Lock,
                    title: 'Toutes vos stratégies personnalisées',
                    description: templateBrand
                        ? `La stratégie complète de ${brandName || 'votre marque'} calquée sur ${templateBrand}`
                        : 'L\'ensemble de vos stratégies marketing et positionnement',
                },
                {
                    icon: Sparkles,
                    title: 'Mises à jour intelligentes par IA',
                    description: 'Notre IA adapte votre stratégie en temps réel selon les actualités de votre secteur et les évolutions de votre marque de référence',
                },
                {
                    icon: TrendingUp,
                    title: 'Veille concurrentielle automatique',
                    description: 'Analyses illimitées des tendances et du marché',
                },
            ],
        },
        upgrade: {
            title: '✨ Débloquez le plein potentiel de votre marque',
            icon: Sparkles,
            items: [
                {
                    icon: Lock,
                    title: 'Stratégies calquées illimitées',
                    description: 'Copiez et adaptez les stratégies des plus grandes marques à votre projet',
                },
                {
                    icon: Sparkles,
                    title: 'Mises à jour automatiques par IA',
                    description: 'Votre stratégie évolue en permanence grâce à notre blog et notre veille sectorielle',
                },
                {
                    icon: TrendingUp,
                    title: 'Analyses de marché illimitées',
                    description: 'Accès complet au radar de tendances et aux insights du marché',
                },
            ],
        },
    };

    const config = warnings[context];
    const IconComponent = config.icon;
    const isUpgrade = context === 'upgrade';

    return (
        <Card className={cn(
            "border-2",
            isUpgrade ? "border-blue-500/30 bg-blue-50/50" : "border-amber-500/30 bg-amber-50/50"
        )}>
            <CardHeader className="pb-3">
                <CardTitle className={cn(
                    "text-lg font-bold flex items-center gap-2",
                    isUpgrade ? "text-blue-900" : "text-amber-900"
                )}>
                    <IconComponent className="w-5 h-5" />
                    {config.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {config.items.map((item, idx) => {
                    const ItemIcon = item.icon;
                    return (
                        <div key={idx} className={cn(
                            "flex gap-3 p-3 rounded-lg bg-white border",
                            isUpgrade ? "border-blue-100" : "border-amber-200"
                        )}>
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                isUpgrade ? "bg-blue-100" : "bg-amber-100"
                            )}>
                                <ItemIcon className={cn(
                                    "w-5 h-5",
                                    isUpgrade ? "text-blue-600" : "text-amber-600"
                                )} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "font-semibold text-sm",
                                    isUpgrade ? "text-blue-900" : "text-amber-900"
                                )}>{item.title}</p>
                                <p className={cn(
                                    "text-xs mt-0.5",
                                    isUpgrade ? "text-blue-700" : "text-amber-700"
                                )}>{item.description}</p>
                            </div>
                        </div>
                    );
                })}

                {!isUpgrade && (
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <p className="text-sm font-semibold text-primary mb-2">💡 Stratégie vivante</p>
                        <p className="text-xs text-muted-foreground">
                            Nos stratégies ne sont pas figées : elles évoluent constamment grâce à notre blog d'actualités et notre IA qui adapte automatiquement votre positionnement aux tendances de votre secteur.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
