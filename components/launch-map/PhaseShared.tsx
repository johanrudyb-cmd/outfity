import {
    Palette,
    Target,
    PenTool,
    FileText,
    Truck,
    Store,
    LucideIcon,
} from 'lucide-react';
import type { LaunchMapData } from './LaunchMapStepper';
import type { BrandIdentity } from './LaunchMapStepper';

export interface SupplierRecap {
    id: string;
    name: string;
    country: string;
    moq?: number;
    leadTime?: number;
    quoteCount: number;
}

export const PHASE_ICONS: Record<number, LucideIcon> = {
    0: Palette,
    1: Target,
    2: PenTool,
    3: FileText,
    4: Truck,
    5: Store,
};

export const PHASE_PRESENTATIONS: Record<number, { intro: string; objectives: string[] }> = {
    0: {
        intro: 'Donnez un nom à votre marque et définissez le produit principal que vous souhaitez lancer.',
        objectives: [
            'Définir le nom de la marque',
            'Valider le type de produit',
            'Optionnel : logo et identité visuelle',
        ],
    },
    1: {
        intro: 'Inspirez-vous d’une grande marque dans votre univers pour aligner votre stratégie.',
        objectives: [
            'Choisir une marque de référence',
            'Récupérer une stratégie marketing adaptée',
            'Valider le positionnement',
        ],
    },
    2: {
        intro: 'Apprenez à créer votre design professionnel grâce au tutoriel vidéo et téléchargez votre pack de mockup.',
        objectives: [
            'Regarder le tutoriel vidéo',
            'Télécharger le pack de mockup',
            'Recommandations IA pour votre vêtement',
        ],
    },
    3: {
        intro: 'Transformez votre mockup en fiche technique fournisseur.',
        objectives: [
            'Sélectionner le mockup',
            'Définir les dimensions (tech pack)',
            'Enregistrer pour le fournisseur',
        ],
    },
    4: {
        intro: 'Contactez des usines qualifiées depuis le Sourcing Hub et obtenez des devis.',
        objectives: [
            'Explorer le Sourcing Hub',
            'Envoyer au moins 2 demandes de devis',
            'Comparer les partenaires usines',
        ],
    },
    5: {
        intro: 'Connectez votre boutique Shopify pour lancer votre marque.',
        objectives: [
            'Saisir votre domaine Shopify',
            'Valider la connexion boutique',
        ],
    },
};

export function PhaseRecap({
    phaseId,
    brandFull,
    launchMap,
    designCount,
    quoteCount,
    ugcCount,
    progress,
    suppliers = [],
}: {
    phaseId: number;
    brandFull: BrandIdentity;
    launchMap: LaunchMapData | null;
    designCount: number;
    quoteCount: number;
    ugcCount: number;
    progress: Record<string, boolean>;
    suppliers?: SupplierRecap[];
}) {
    const completed = progress[`phase${phaseId}`];
    const sg = brandFull?.styleGuide && typeof brandFull.styleGuide === 'object' ? brandFull.styleGuide as Record<string, unknown> : null;
    const productType = (sg?.productType as string) || null;

    const item = (label: string, value: string | number | null | undefined) =>
        value != null && String(value).trim() !== '' ? (
            <div key={label}>
                <dt className="text-[#86868B] text-[11px] font-bold uppercase tracking-widest">{label}</dt>
                <dd className="text-[#1D1D1F] font-semibold text-[15px] mt-1">{value}</dd>
            </div>
        ) : null;

    if (phaseId === 0) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Nom de la marque', brandFull?.name ?? null)}
                {item('Type de produit', productType)}
            </dl>
        );
    }

    if (phaseId === 1) {
        const slug = brandFull?.templateBrandSlug?.trim();
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Marque d\'inspiration', slug)}
            </dl>
        );
    }

    if (phaseId === 4) {
        return (
            <div className="space-y-4">
                <div>
                    <dt className="text-[#86868B] text-[11px] font-bold uppercase tracking-widest">Devis envoyés</dt>
                    <dd className="text-[#1D1D1F] font-semibold text-[15px] mt-1">{quoteCount}</dd>
                </div>
                {suppliers && suppliers.length > 0 && (
                    <ul className="space-y-2 mt-4">
                        {suppliers.map(s => (
                            <li key={s.id} className="text-[#1D1D1F] text-[13px] font-medium flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#86868B]/30 before:rounded-full">
                                {s.name} <span className="text-[#86868B] font-normal">({s.country})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return <p className="text-[13px] text-[#86868B] italic">Aucun récapitulatif détaillé pour cette phase.</p>;
}
