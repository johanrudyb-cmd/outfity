import Link from 'next/link';
import { ArrowLeft, HelpCircle, Book, Mail } from 'lucide-react';

export const metadata = {
  title: 'Support | OUTFITY',
  description: 'Centre d\'aide et support de la plateforme OUTFITY par OUTFITY.',
};

export default function SupportPage() {
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
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-4">Support OUTFITY</h1>
          <p className="text-[#6e6e73] leading-relaxed mb-8">
            Retrouvez ici les ressources pour utiliser la plateforme OUTFITY (éditée par
            OUTFITY) et nous contacter en cas de besoin. L&apos;accès complet aux services
            (Market Intelligence, Sourcing, Studio IA, Stratégie) nécessite un abonnement&nbsp;:
            consultez les{' '}
            <Link href="/legal/terms" className="text-[#007AFF] hover:underline">
              CGV/CGU
            </Link>
            {' '}pour les conditions d&apos;accès et de résiliation.
          </p>

          <div className="space-y-6">
            <Link
              href="/#faq-section"
              className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2] hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/20">
                <HelpCircle className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">FAQ</h2>
                <p className="text-sm text-[#6e6e73]">
                  Réponses aux questions fréquentes sur les offres, le Design Studio, les tech
                  packs et le sourcing.
                </p>
              </div>
            </Link>

            <Link
              href="/docs"
              className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2] hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/20">
                <Book className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">Documentation</h2>
                <p className="text-sm text-[#6e6e73]">
                  Guides et tutoriels pour prendre en main les fonctionnalités de la plateforme.
                </p>
              </div>
            </Link>

            <Link
              href="/contact"
              className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2] hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/20">
                <Mail className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">Nous contacter</h2>
                <p className="text-sm text-[#6e6e73]">
                  Pour une question technique ou commerciale, écrivez-nous à{' '}
                  <span className="text-[#007AFF] font-medium">contact@outfity.fr</span> ou
                  via la page Contact.
                </p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
