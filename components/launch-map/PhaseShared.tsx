import {
    Palette,
    Target,
    PenTool,
    FileText,
    Truck,
    Store,
    LucideIcon,
    Zap,
    MessageSquare,
    Users,
    FileSearch,
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
    3: Zap,           // Nouveau: Scanner/Radar
    4: MessageSquare, // Nouveau: Joy/Scripts
    5: Users,         // Nouveau: Waitlist
    6: FileSearch,    // Nouveau: Tech Pack
    7: Truck,         // Sourcing
    8: Store,         // Boutique
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
        intro: 'Valider le potentiel viral de votre design avant de lancer la production.',
        objectives: [
            'Importer le design cible',
            'Passer le scanner IA',
            'Obtenir le feu vert anti-crash',
        ],
    },
    4: {
        intro: 'Préparez votre communication virale pour TikTok et Reels avec Joy.',
        objectives: [
            'Définir le concept viral',
            'Obtenir les scripts exacts',
            'Appliquer la Directive Anti-Crash',
        ],
    },
    5: {
        intro: 'Générez votre Waitlist optimisée pour l\'acquisition.',
        objectives: [
            'Lancer la Landing Page',
            'Récolter les 100 premiers emails',
            'Valider la preuve de marché',
        ],
    },
    6: {
        intro: 'Transformez votre mockup validé en fiche technique usine.',
        objectives: [
            'Sélectionner le mockup',
            'Définir les dimensions',
            'Enregistrer pour les partenaires',
        ],
    },
    7: {
        intro: 'Contactez des usines qualifiées depuis le Sourcing Hub et obtenez des devis.',
        objectives: [
            'Explorer le Sourcing Hub',
            'Envoyer 2 demandes de devis',
            'Comparer les partenaires',
        ],
    },
    8: {
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
        const sg0 = brandFull?.styleGuide && typeof brandFull.styleGuide === 'object' ? brandFull.styleGuide as Record<string, unknown> : null;
        const sh = brandFull?.socialHandles && typeof brandFull.socialHandles === 'object' ? brandFull.socialHandles as Record<string, string> : {};

        const signature = sg0?.productSignature as string | null;
        const weight = sg0?.productWeight as string | null;
        const story = sg0?.story as string | null;
        const stage = sg0?.stage as string | null;
        const noLogo = sg0?.noLogo === true || sg0?.noLogo === 'true';

        return (
            <div className="space-y-12">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    {item('Nom de la marque', brandFull?.name ?? null)}
                    {item('Type de produit', productType)}
                    {item('Grammage (GSM)', weight)}
                    {item('Signature Visuelle', signature)}
                    {item('Étape du projet', stage === 'ideation' ? 'Simple Idée' : stage === 'prelaunch' ? 'En Conception' : stage === 'launch' ? 'Prêt au Lancement' : stage)}
                    {item('Logo', noLogo ? 'À créer plus tard' : 'Logo importé')}
                </dl>

                {(brandFull?.domain || sh.instagram || sh.twitter) && (
                    <div className="pt-8 border-t border-black/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF] mb-6">Présence Digitale</p>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                            {item('Nom de domaine', brandFull?.domain)}
                            {item('Instagram', sh.instagram ? `@${sh.instagram.replace('@', '')}` : null)}
                            {item('TikTok', sh.twitter ? `@${sh.twitter.replace('@', '')}` : null)}
                        </dl>
                    </div>
                )}

                {story && (
                    <div className="pt-8 border-t border-black/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF] mb-6">Le Manifeste</p>
                        <p className="text-[#1D1D1F] font-medium text-[15px] leading-relaxed italic border-l-2 border-[#007AFF]/20 pl-6">
                            "{story}"
                        </p>
                    </div>
                )}
            </div>
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

    if (phaseId === 2) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Nombre de designs enregistrés', designCount > 0 ? `${designCount} mockup(s)` : '0')}
            </dl>
        );
    }

    if (phaseId === 3) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Score de Viralité', '82/100')}
                {item('Statut Radar', 'Validé')}
            </dl>
        );
    }

    if (phaseId === 4) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Scripts générés', 'Prêts pour TikTok')}
            </dl>
        );
    }

    if (phaseId === 5) {
        const goal = 100;
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Emails récoltés', '100+')}
                {item('Preuve de marché', 'Validée')}
            </dl>
        );
    }

    if (phaseId === 6) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Fiche Technique', launchMap?.phase6 ? 'Générée et disponible' : 'En attente')}
            </dl>
        );
    }

    if (phaseId === 7) {
        return (
            <div className="space-y-4">
                <div>
                    <dt className="text-[#86868B] text-[11px] font-bold uppercase tracking-widest">Usines contactées</dt>
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

    if (phaseId === 8) {
        return (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {item('Boutique Shopify', launchMap?.shopifyShopDomain || 'En cours de configuration')}
            </dl>
        );
    }

    return <p className="text-[13px] text-[#86868B] italic">Phase complétée avec succès.</p>;
}
