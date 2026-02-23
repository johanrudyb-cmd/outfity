'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Lock, Image as ImageIcon, Save, CheckCircle2, FileText, Download, Loader2 } from 'lucide-react';
import { SubscriptionWarning } from '@/components/subscription/SubscriptionWarning';
import { cn } from '@/lib/utils';

interface SettingsFormProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    plan: string;
    stripeCustomerId?: string | null;
  };
}

export function SettingsForm({ user: initialUser }: SettingsFormProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const res = await fetch('/api/stripe/invoices');
        const data = await res.json();
        if (data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (err) {
        console.error('Erreur factures:', err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    if (user.stripeCustomerId) {
      fetchInvoices();
    }
  }, [user.stripeCustomerId]);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    image: user.image || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Impossible d\'ouvrir le portail de facturation');
      }
    } catch (err) {
      setError('Erreur réseau');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      if (formData.newPassword && formData.newPassword.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        setLoading(false);
        return;
      }

      const updateData: any = {
        name: formData.name,
        image: formData.image,
      };

      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la mise à jour');
        setLoading(false);
        return;
      }

      // Mettre à jour l'état utilisateur avec les nouvelles données
      setUser(data);

      // Mettre à jour les champs du formulaire avec les nouvelles valeurs
      setFormData((prev) => ({
        ...prev,
        name: data.name || '',
        email: data.email,
        image: data.image || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSuccess(true);

      // Rafraîchir la page pour mettre à jour les données côté serveur
      setTimeout(() => {
        router.refresh();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Profil */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-6 py-5 bg-black/[0.02] border-b border-black/[0.04] flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">Profil Personnel</h3>
              <p className="text-[13px] text-[#86868B]">Mettez à jour vos informations publiques.</p>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#1D1D1F]">Nom complet</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Votre nom"
                  className="h-12 bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#1D1D1F]">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre@email.com"
                  className="h-12 bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1D1D1F]">Photo de profil (URL)</label>
              <Input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="h-12 bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl transition-all"
              />
              <p className="text-[11px] text-[#86868B]">Collez l'URL d'une image pour votre avatar.</p>
            </div>
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-6 py-5 bg-black/[0.02] border-b border-black/[0.04] flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">Sécurité</h3>
              <p className="text-[13px] text-[#86868B]">Protégez votre compte avec un mot de passe robuste.</p>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#1D1D1F]">Mot de passe actuel</label>
              <Input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Laissez vide pour ne pas changer"
                className="h-12 max-w-sm bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#FF3B30]/30 focus:ring-4 focus:ring-[#FF3B30]/10 rounded-xl transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#1D1D1F]">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  className="h-12 bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#FF3B30]/30 focus:ring-4 focus:ring-[#FF3B30]/10 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-[#1D1D1F]">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Répétez le mot de passe"
                  className="h-12 bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#FF3B30]/30 focus:ring-4 focus:ring-[#FF3B30]/10 rounded-xl transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-6 py-5 bg-black/[0.02] border-b border-black/[0.04] flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">Abonnement</h3>
              <p className="text-[13px] text-[#86868B]">Gérez votre plan actuel et vos accès.</p>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <SubscriptionWarning context="cancel" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-[#F5F5F7] rounded-[16px] border border-black/[0.04] gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-[19px] text-[#1D1D1F]">
                    {user.plan === 'free' ? 'Plan Gratuit' : 'Plan Créateur'}
                  </p>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                    user.plan === 'free' ? "bg-black/10 text-black/70" : "bg-emerald-500/15 text-emerald-700"
                  )}>
                    {user.plan === 'free' ? 'RESTREINT' : 'ACTIF'}
                  </span>
                </div>
                <p className="text-[13px] text-[#86868B] font-medium mt-1.5 max-w-sm leading-relaxed">
                  {user.plan === 'free' ? 'Débloquez tout le potentiel de vos données avec les quotas illimités et l\'IA complète.' : 'Accès intégral à l\'écosystème Créateur. Tous les outils débloqués.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link href="/auth/choose-plan">
                  <Button variant="outline" className="w-full sm:w-auto h-10 rounded-xl font-semibold border-black/10 hover:bg-black/5 hover:border-black/20 transition-all">
                    Changer de plan
                  </Button>
                </Link>
                {user.stripeCustomerId && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 rounded-xl font-semibold border-black/10 hover:bg-black/5 hover:border-black/20 transition-all"
                    onClick={handlePortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Connexion à Stripe...' : 'Gérer la facturation'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Factures */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-6 py-5 bg-black/[0.02] border-b border-black/[0.04] flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">Historique de facturation</h3>
              <p className="text-[13px] text-[#86868B]">Consultez et téléchargez vos factures Stripe.</p>
            </div>
          </div>
          <div className="p-0 sm:p-2">
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D1D1F]"></div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-black/[0.04]">
                      <th className="py-4 px-6 font-semibold text-[#86868B]">Identifiant</th>
                      <th className="py-4 px-6 font-semibold text-[#86868B]">Date</th>
                      <th className="py-4 px-6 font-semibold text-[#86868B]">Montant</th>
                      <th className="py-4 px-6 font-semibold text-[#86868B]">Statut</th>
                      <th className="py-4 px-6 text-right">Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-[#1D1D1F]">{invoice.number}</td>
                        <td className="py-4 px-6 text-[#6e6e73]">
                          {new Date(invoice.date * 1000).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6 font-semibold text-[#1D1D1F]">
                          {(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            invoice.status === 'paid' ? 'bg-[#34C759]/15 text-[#34C759]' : 'bg-[#FF9500]/15 text-[#FF9500]'
                          )}>
                            {invoice.status === 'paid' ? 'Payée' : invoice.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {invoice.pdf && (
                            <a
                              href={invoice.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Télécharger PDF"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-black/5 hover:bg-[#007AFF] text-[#1D1D1F] hover:text-white transition-all shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-[#86868B]" />
                </div>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">Aucune facture</p>
                <p className="text-[13px] text-[#86868B] mt-1 max-w-sm mx-auto">
                  {!user.stripeCustomerId
                    ? "Vos factures apparaîtront ici après votre premier paiement sur la plateforme."
                    : "Aucune facture trouvée sur votre compte Stripe lié."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[16px] text-center">
            <p className="text-[13px] text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[16px] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-[13px] text-emerald-600 font-semibold">Modifications enregistrées avec succès !</p>
          </div>
        )}

        {/* Float Submit Button (ou Sticky Bottom) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-[500px] flex items-center justify-between bg-black/90 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-2xl border border-white/10 hidden md:flex">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white/80" />
            </div>
            <div>
              <p className="text-[13px] font-bold">Profil & Préférences</p>
              <p className="text-[10px] text-white/60">Gardez vos informations à jour</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 rounded-full px-5 font-bold bg-white text-black hover:bg-white/90 transition-all shadow-md shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
          </Button>
        </div>

        {/* Mobile Submit (in flow) */}
        <div className="md:hidden pt-4 pb-8">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl font-bold bg-black text-white hover:bg-black/90 transition-all shadow-lg text-[15px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer les modifications'}
          </Button>
        </div>

      </form>
    </div>
  );
}
