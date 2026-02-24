import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | OUTFITY',
  description: 'Politique de confidentialité et protection des données personnelles - OUTFITY.',
};

export default function PrivacyPage() {
  return (
    <article className="bg-white rounded-2xl border border-[#F2F2F2] p-8 md:p-12 shadow-sm">
      <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-[#6e6e73] mb-8">
        Dernière mise à jour : Février 2026
      </p>

      <div className="prose prose-neutral max-w-none text-[#1D1D1F] space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            1. Responsable du traitement
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Le responsable du traitement des données personnelles collectées via la plateforme
            OUTFITY est BIANGORY (Auto-entreprise, RCS TOURS 92907536400018, 1 ALLÉE D&apos;ARTOIS,
            37000 TOURS). Pour toute question relative à vos données, vous pouvez nous contacter
            à&nbsp;:{' '}
            <a href="mailto:contact@outfity.fr" className="text-[#007AFF] hover:underline">
              contact@outfity.fr
            </a>
            , ou via la page{' '}
            <Link href="/contact" className="text-[#007AFF] hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            2. Données collectées
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Les données collectées sont nécessaires à la gestion de l&apos;Abonnement et à
            l&apos;utilisation de la Plateforme. Nous collectons les données liées à la création
            et à la gestion de votre compte (identité, adresse e-mail, mot de passe chiffré),
            ainsi que les données relatives à votre activité (projets, designs, préférences,
            facturation le cas échéant). Les données de navigation (adresse IP, type de
            navigateur, pages visitées) peuvent être collectées pour assurer la sécurité et
            améliorer nos services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            3. Finalités et bases légales
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Vos données sont traitées conformément au Règlement Général sur la Protection des
            Données (RGPD) pour&nbsp;: l&apos;exécution du contrat (fourniture des services
            souscrits), la gestion du compte et du support, le respect de nos obligations légales
            (facturation, conservation), et, le cas échéant avec votre consentement,
            l&apos;envoi de communications commerciales ou l&apos;amélioration de nos produits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            4. Durée de conservation
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Les données de compte sont conservées pendant la durée d&apos;utilisation du service
            puis pendant les délais légaux (notamment comptables et fiscaux). Les données de
            facturation sont conservées conformément à la réglementation en vigueur. Au-delà,
            les données sont anonymisées ou supprimées.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            5. Destinataires et transferts
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Les données peuvent être hébergées par des prestataires tiers (hébergeurs, solutions
            de paiement) situés dans l&apos;Union Européenne ou présentant des garanties de
            conformité équivalentes. Vos données sont accessibles aux équipes internes habilitées
            et, le cas échéant, à ces prestataires dans le cadre de garanties contractuelles. En
            cas de transfert hors Union européenne, des garanties appropriées (clauses types,
            décisions d&apos;adéquation) sont mises en œuvre.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            6. Vos droits (RGPD)
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Le Client dispose d&apos;un droit d&apos;accès, de rectification et de suppression
            de ses données en contactant&nbsp;:{' '}
            <a href="mailto:contact@outfity.fr" className="text-[#007AFF] hover:underline">
              contact@outfity.fr
            </a>
            . Vous disposez également d&apos;un droit à la limitation du traitement, à la
            portabilité et à l&apos;opposition dans les conditions prévues par le RGPD. Vous
            pouvez exercer ces droits en nous contactant ou depuis les paramètres de votre
            compte. Vous avez le droit d&apos;introduire une réclamation auprès de la CNIL
            (www.cnil.fr).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            7. Sécurité
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
            protéger vos données contre l&apos;accès non autorisé, la perte ou l&apos;altération
            (chiffrement, accès restreint, sauvegardes). Les mots de passe sont stockés de manière
            sécurisée et ne sont jamais communiqués en clair.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            8. Cookies
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Le site peut utiliser des cookies et technologies similaires pour le bon
            fonctionnement de la session, la mémorisation de vos préférences et l&apos;analyse
            d&apos;audience. Vous pouvez gérer vos préférences via les paramètres de votre
            navigateur ou notre bandeau d&apos;information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-8 mb-3">
            9. Modifications
          </h2>
          <p className="text-[#6e6e73] leading-relaxed">
            Nous pouvons mettre à jour cette politique de confidentialité. La date de dernière
            mise à jour sera indiquée en tête de page. En cas de changement important, nous
            vous en informerons par e-mail ou via un message sur la plateforme. Les présentes
            dispositions sont à lire en complément des{' '}
            <Link href="/legal/terms" className="text-[#007AFF] hover:underline">
              CGV/CGU
            </Link>
            (section 8. Données personnelles).
          </p>
        </section>
      </div>
    </article>
  );
}
