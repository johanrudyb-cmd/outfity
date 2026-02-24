import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, MessageSquare, Instagram } from 'lucide-react';

export const metadata = {
  title: 'Contact | OUTFITY',
  description: 'Contactez OUTFITY / OUTFITY pour toute question ou demande.',
};

export default function ContactPage() {
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
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-4">Contact</h1>
          <p className="text-[#6e6e73] leading-relaxed mb-8">
            Une question sur la plateforme OUTFITY, nos offres, un problème technique ou une
            demande de partenariat ? Utilisez les coordonnées ci-dessous. OUTFITY (éditeur
            d&apos;OUTFITY) vous répond dans les meilleurs délais.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">E-mail</h2>
                <p className="text-sm text-[#6e6e73]">
                  Pour toute demande générale, juridique, commerciale ou relative à vos
                  données personnelles (RGPD)&nbsp;:
                </p>
                <a
                  href="mailto:contact@outfity.fr"
                  className="text-[#007AFF] font-medium hover:underline mt-1 inline-block"
                >
                  contact@outfity.fr
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">Siège social</h2>
                <p className="text-sm text-[#6e6e73]">
                  OUTFITY – 1 ALLÉE D&apos;ARTOIS, 37000 TOURS
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">Support</h2>
                <p className="text-sm text-[#6e6e73]">
                  Utilisateurs abonnés : accédez au support depuis votre tableau de bord ou
                  consultez la page{' '}
                  <Link href="/support" className="text-[#007AFF] hover:underline">
                    Support
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#F2F2F2]">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <Instagram className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F] mb-1">Réseaux sociaux – OUTFITY</h2>
                <p className="text-sm text-[#6e6e73] mb-2">
                  Suivez-nous sur Instagram et TikTok pour les actualités et conseils mode.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://www.instagram.com/biangory/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#007AFF] font-medium hover:underline"
                  >
                    Instagram @biangory
                  </a>
                  <a
                    href="https://www.tiktok.com/@biangory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#007AFF] font-medium hover:underline"
                  >
                    TikTok @biangory
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#6e6e73] mt-8">
            Nous nous efforçons de répondre sous 48 à 72 heures ouvrées.
          </p>
        </article>
      </main>
    </div>
  );
}
