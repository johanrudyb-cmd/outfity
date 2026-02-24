import Link from 'next/link';
import { ArrowLeft, TrendingUp, Factory, Sparkles, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'À propos | OUTFITY',
  description: 'Découvrez OUTFITY par OUTFITY : l\'outil d\'aide à la création et au développement de marques de vêtement.',
};

export default function AboutPage() {
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
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-4">À propos d&apos;OUTFITY</h1>
          <p className="text-[#6e6e73] leading-relaxed mb-8">
            OUTFITY est une plateforme SaaS éditée par <strong className="text-[#1D1D1F]">OUTFITY</strong> (Auto-entreprise,
            RCS TOURS 92907536400018). Elle constitue un outil d&apos;aide à la création et au
            développement de marques de vêtement (&quot;Brand Building&quot;). Le Prestataire agit en
            tant que fournisseur de technologies et de données&nbsp;: il n&apos;est ni fabricant
            de vêtements, ni agent commercial, ni conseiller financier.
          </p>

          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-4">Les services</h2>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <strong className="text-[#1D1D1F]">Market Intelligence</strong>
                <p className="text-sm text-[#6e6e73] mt-1">
                  Accès à une base de données de tendances (15 000+ références).
                </p>
              </div>
            </li>
            <li className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <Factory className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <strong className="text-[#1D1D1F]">Sourcing</strong>
                <p className="text-sm text-[#6e6e73] mt-1">
                  Mise à disposition d&apos;un annuaire de fournisseurs (usines textiles).
                </p>
              </div>
            </li>
            <li className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <strong className="text-[#1D1D1F]">Studio IA</strong>
                <p className="text-sm text-[#6e6e73] mt-1">
                  Outils de génération d&apos;images, de mannequins virtuels et de contenus
                  marketing assistés par Data & Sourcing.
                </p>
              </div>
            </li>
            <li className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <strong className="text-[#1D1D1F]">Stratégie</strong>
                <p className="text-sm text-[#6e6e73] mt-1">
                  Analyse de modèles économiques de marques tierces.
                </p>
              </div>
            </li>
          </ul>

          <p className="text-[#6e6e73] leading-relaxed">
            Pour en savoir plus sur nos offres et tarifs, consultez la section{' '}
            <Link href="/#pricing-section" className="text-[#007AFF] hover:underline">
              Tarifs
            </Link>
            {' '}sur la page d&apos;accueil, ou{' '}
            <Link href="/contact" className="text-[#007AFF] hover:underline">
              contactez-nous
            </Link>
            . Les conditions d&apos;accès et d&apos;utilisation sont détaillées dans nos{' '}
            <Link href="/legal/terms" className="text-[#007AFF] hover:underline">
              CGV/CGU
            </Link>
            .
          </p>
        </article>
      </main>
    </div>
  );
}
