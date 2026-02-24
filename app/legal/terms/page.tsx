import type { Metadata } from 'next';
import { CGVCGUContent } from '@/components/legal/CGVCGUContent';

export const metadata: Metadata = {
  title: 'CGV/CGU - Conditions Générales de Vente et d\'Utilisation | OUTFITY',
  description: 'Conditions générales de vente et d\'utilisation de la plateforme OUTFITY.',
};

export default function TermsPage() {
  return <CGVCGUContent />;
}
