'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { X, Settings, LogOut, Zap, LayoutDashboard, TrendingUp, Camera, PenSquare, Calculator, Sparkles, Receipt, ShieldCheck, HelpCircle, MessageCircle } from 'lucide-react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const navigation = [
  { name: 'Dashboard', short: 'Accueil', href: '/dashboard', tourId: 'tour-dashboard', icon: LayoutDashboard, badge: undefined as string | undefined },
  { name: 'Viral sur Tiktok', short: 'Viral', href: '/trends', tourId: 'tour-trends', icon: TrendingUp, badge: undefined as string | undefined },
  { name: 'Détecter une tendance', short: 'Scanner', href: '/trends/visual', tourId: 'tour-spy', icon: Camera, badge: undefined as string | undefined },
];

const tools = [
  { name: 'Gérer ma marque', short: 'Marque', href: '/launch-map', tourId: 'tour-launch-map', icon: Sparkles, featured: true, disabled: false },
  { name: 'Calculateur de marge', short: 'Calcul', href: '/calculator', tourId: 'tour-calculator', icon: Calculator, disabled: false },
  { name: 'Création de contenu', short: 'Contenu', href: '/content-creation', tourId: 'tour-content-creation', icon: PenSquare, disabled: false },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: userPlanData } = useSWR('/api/user/plan', fetcher);

  const isAdmin = session?.user?.email && (
    ['contact@outfity.fr', 'johanrudyb@gmail.com'].includes(session.user.email) ||
    session.user.email.endsWith('@biangory.com')
  );

  const isAffiliate = userPlanData?.affiliate?.status === 'ACTIVE';

  const handleNav = () => onClose?.();

  // ── Compact icon sidebar for tablets (md, hidden on lg+) ──────────────────
  const CompactSidebar = () => (
    <aside className="hidden md:flex lg:hidden fixed left-0 top-0 bottom-0 w-[68px] bg-white/95 backdrop-blur-xl border-r border-black/5 flex-col z-50 overflow-y-auto py-4 items-center gap-1 shrink-0 overscroll-contain">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 mb-3 shrink-0" title="Dashboard">
        <Image src="/icon.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
      </Link>

      {/* Nav items */}
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <motion.div key={item.href} whileTap={{ scale: 0.9 }}>
            <Link
              href={item.href}
              title={item.name}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl transition-all duration-200',
                isActive ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1D1D1F]/40 hover:bg-black/5 hover:text-[#1D1D1F]'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none">{item.short}</span>
            </Link>
          </motion.div>
        );
      })}

      {/* Separator */}
      <div className="w-8 h-px bg-black/8 my-1" />

      {/* Tools */}
      {tools.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <div
              key={item.href}
              title={item.name + " (Bientôt)"}
              className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl opacity-40 cursor-not-allowed text-[#1D1D1F]/50 grayscale"
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none text-[#1D1D1F]/60">Bientôt</span>
            </div>
          );
        }

        return (
          <motion.div key={item.href} whileTap={{ scale: 0.9 }}>
            <Link
              href={item.href}
              title={item.name}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl transition-all duration-200',
                isActive ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1D1D1F]/40 hover:bg-black/5 hover:text-[#1D1D1F]'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none">{item.short}</span>
            </Link>
          </motion.div>
        );
      })}

      {/* Partenariat */}
      {isAffiliate && (
        <>
          <div className="w-8 h-px bg-black/8 my-1" />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Link
              href="/partners"
              title="Mes commissions"
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl transition-all duration-200',
                pathname === '/partners' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1D1D1F]/40 hover:bg-black/5 hover:text-[#1D1D1F]'
              )}
            >
              <Receipt className="w-5 h-5" strokeWidth={pathname === '/partners' ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none text-center">Partenariat</span>
            </Link>
          </motion.div>
        </>
      )}

      {/* Admin */}
      {isAdmin && (
        <>
          <div className="w-8 h-px bg-black/8 my-1" />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Link
              href="/admin/partners"
              title="Administration"
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl transition-all duration-200',
                pathname.startsWith('/admin/partners') ? 'bg-red-50 text-red-600' : 'text-[#1D1D1F]/40 hover:bg-red-50/50 hover:text-red-500'
              )}
            >
              <ShieldCheck className="w-5 h-5" strokeWidth={pathname.startsWith('/admin/partners') ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-tight leading-none text-center">Admin</span>
            </Link>
          </motion.div>
        </>
      )}

      {/* Bottom Spacer + Help */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <div className="w-8 h-px bg-black/8 my-1" />
        <motion.div whileTap={{ scale: 0.9 }}>
          <a
            href="https://instagram.com/biangory"
            target="_blank"
            rel="noopener noreferrer"
            title="Besoin d'aide ? DM sur Instagram"
            className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-2xl text-[#1D1D1F]/40 hover:bg-black/5 hover:text-[#1D1D1F] transition-all duration-200"
          >
            <HelpCircle className="w-5 h-5" strokeWidth={2} />
            <span className="text-[8px] font-black uppercase tracking-tight leading-none">Aide</span>
          </a>
        </motion.div>
      </div>

    </aside>
  );

  return (
    <>
      {/* ── Compact sidebar tablet (md only) ── */}
      <CompactSidebar />

      {/* ── Full sidebar: mobile drawer + desktop fixed ── */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-[100dvh] lg:h-screen w-72 max-w-[85vw] backdrop-blur-xl bg-white/95 flex flex-col z-[70] overflow-hidden',
          'transform transition-transform duration-300 ease-out',
          // Desktop: force flex and visible. Tablet: hidden (compact sidebar takes over).
          'md:hidden lg:flex lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl flex' : '-translate-x-full'
        )}
      >
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#007AFF]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#007AFF]/[0.02] rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-black/5 flex items-center justify-center relative min-h-[100px]">
          <Link href="/dashboard" className="block shrink-0" onClick={handleNav}>
            <Image src="/icon.png" alt="Logo" width={96} height={96} className="h-20 w-20 shrink-0 object-contain bg-transparent" />
          </Link>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="lg:hidden absolute right-4 sm:right-6 touch-target flex items-center justify-center rounded-xl text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#1D1D1F] active:scale-95 active:bg-black/10"
            onClick={onClose}
          >
            <X className="h-6 w-6 shrink-0" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-5 pb-6 px-5 space-y-7 flex flex-col">
          {/* Navigation section */}
          <div>
            <h2 className="px-4 mb-3 text-[10px] font-black text-[#1D1D1F]/20 uppercase tracking-[0.2em]">Platform</h2>
            <div className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <motion.div key={item.name} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={item.href}
                      data-tour={item.tourId}
                      onClick={handleNav}
                      className={cn(
                        'flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[#007AFF]/10 text-[#007AFF]'
                          : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#1D1D1F]'
                      )}
                      title={item.name}
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px] font-bold bg-[#007AFF] text-white border-none px-2 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Outils de création */}
          <div>
            <h2 className="px-4 mb-3 text-[10px] font-black text-[#1D1D1F]/20 uppercase tracking-[0.2em]">Creative Hub</h2>
            <div className="space-y-0.5">
              {tools.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      title={item.name + ' (Bientôt)'}
                      className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-2xl text-[15px] font-medium opacity-50 cursor-not-allowed text-[#1D1D1F]/60"
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="px-1.5 py-0.5 bg-black/5 text-[#1D1D1F]/40 font-black uppercase tracking-widest text-[8px] rounded">
                        Bientôt
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.div key={item.name} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={item.href}
                      data-tour={item.tourId}
                      onClick={handleNav}
                      className={cn(
                        'flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[#007AFF]/10 text-[#007AFF]'
                          : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#1D1D1F]'
                      )}
                      title={item.name}
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Partenariat */}
          {isAffiliate && (
            <div>
              <h2 className="px-4 mb-3 text-[10px] font-black text-[#007AFF]/30 uppercase tracking-[0.2em]">Revenue</h2>
              <div className="space-y-0.5">
                <Link
                  href="/partners"
                  onClick={handleNav}
                  className={cn(
                    'flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-200 active:scale-[0.98]',
                    pathname === '/partners'
                      ? 'bg-[#007AFF]/10 text-[#007AFF]'
                      : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#1D1D1F]'
                  )}
                >
                  <Receipt className="w-5 h-5 shrink-0" strokeWidth={pathname === '/partners' ? 2.5 : 2} />
                  <span>Mes commissions</span>
                </Link>
              </div>
            </div>
          )}

          {/* Business / Admin */}
          {isAdmin && (
            <div>
              <h2 className="px-4 mb-3 text-[10px] font-black text-[#E11D48]/30 uppercase tracking-[0.2em]">Console Admin</h2>
              <div className="space-y-0.5">
                <Link
                  href="/admin/partners"
                  onClick={handleNav}
                  className={cn(
                    'flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-200 active:scale-[0.98]',
                    pathname.startsWith('/admin/partners')
                      ? 'bg-red-50 text-red-600'
                      : 'text-[#1D1D1F]/60 hover:bg-red-50/50 hover:text-red-600'
                  )}
                >
                  <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={pathname.startsWith('/admin/partners') ? 2.5 : 2} />
                  <span>Gestion Partenaires</span>
                </Link>
                {/* On peut ajouter d'autres liens admin ici plus tard */}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4 relative z-10">
            {/* Usage Brief Card (Small version of what's in UserAccountNav) */}
            {userPlanData?.usage && (
              <div className="p-4 bg-[#F5F5F7] rounded-[24px] border border-black/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border shrink-0",
                    userPlanData?.plan === 'creator'
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-[#007AFF]/5 text-[#007AFF] border-[#007AFF]/10"
                  )}>
                    {userPlanData?.plan === 'creator' ? 'Créateur' : 'Starter'}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#86868B] mb-0.5">Quotas IA</span>
                    <span className="text-[10px] font-bold text-[#1D1D1F]">{userPlanData.usage.total} / {userPlanData.usage.limit}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007AFF] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (userPlanData.usage.total / userPlanData.usage.limit) * 100)}%` }}
                  />
                </div>
                <Link href="/usage" onClick={handleNav} className="block mt-3 text-center text-[9px] font-black uppercase text-[#007AFF] hover:underline">
                  Détails & Quotas
                </Link>
              </div>
            )}

            {/* Support / Community Card */}
            <div className="p-5 bg-black rounded-[28px] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-1.5 italic">Besoin d'aide ?</h3>
                <p className="text-[10px] font-medium text-white/50 leading-relaxed max-w-[140px] mb-4">Contactez le support directement sur Instagram.</p>
                <a
                  href="https://instagram.com/biangory"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
                    Assistance
                  </button>
                </a>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
