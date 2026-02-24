import Link from 'next/link';
import { ArrowLeft, Book, TrendingUp, Factory, Sparkles, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Documentation | OUTFITY',
  description: 'Documentation et guides d\'utilisation de la plateforme OUTFITY par OUTFITY.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-[#F2F2F2] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#6e6e73] hover:text-[#007AFF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 pb-20">
        <article className="bg-white rounded-2xl border border-[#F2F2F2] p-8 md:p-12 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
              <Book className="w-6 h-6 text-[#007AFF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1D1D1F]">Documentation OUTFITY</h1>
              <p className="text-[#6e6e73] text-sm mt-1">
                Guides et ressources pour bien utiliser la plateforme (OUTFITY)
              </p>
            </div>
          </div>

          <p className="text-[#6e6e73] leading-relaxed mb-8">
            OUTFITY est un outil d&apos;aide à la création et au développement de marques de
            mode. Les services incluent notamment&nbsp;: Market Intelligence (base de tendances
            15 000+ références), Sourcing (annuaire de fournisseurs), Studio IA (génération
            d&apos;images, mannequins virtuels, contenus marketing), et Stratégie (analyse de
            modèles économiques). Les conditions d&apos;accès et d&apos;utilisation sont détaillées
            dans les{' '}
            <Link href="/legal/terms" className="text-[#007AFF] hover:underline">
              CGV/CGU
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-4">Modules couverts</h2>
          <ul className="space-y-3 mb-8 text-[#6e6e73]">
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#007AFF] shrink-0" />
              Tendances et Market Intelligence
            </li>
            <li className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#007AFF] shrink-0" />
              Sourcing et annuaire fournisseurs
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#007AFF] shrink-0" />
              Design Studio, tech packs, UGC et contenus IA
            </li>
            <li className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#007AFF] shrink-0" />
              Launch Map et stratégie
            </li>
          </ul>

          <p className="text-[#6e6e73] leading-relaxed">
            La documentation détaillée par module sera enrichie progressivement. En attendant,
            consultez la{' '}
            <Link href="/#faq-section" className="text-[#007AFF] hover:underline">
              FAQ
            </Link>
            {' '}sur la page d&apos;accueil ou contactez-nous à{' '}
            <a href="mailto:contact@outfity.fr" className="text-[#007AFF] hover:underline">
              contact@outfity.fr
            </a>
            .
          </p>
        </article>
      </main>
    </div>
  );
}
