'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { proxyImageUrl } from '@/lib/image-proxy';
import { Flame, Lock, Music, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { getBrandLogoUrl, getBrandKey } from '@/lib/curated-brands';
import { REFERENCE_BRAND_WEBSITES } from '@/lib/constants/audience-reference-brands';
import { motion, AnimatePresence } from 'framer-motion';
import { UsageBadge } from '@/components/trends/UsageBadge';
import { safeDisplayBrand } from '@/lib/constants/retailer-exclusion';

/** Badge de viralité selon le trendScore */
function getViralityBadge(score: number): { emoji: string; label: string; color: string } {
  if (score >= 90) return { emoji: '🔥', label: 'Viral TikTok', color: '#FF3B30' };
  if (score >= 80) return { emoji: '📈', label: 'Tendance Instagram', color: '#007AFF' };
  if (score >= 70) return { emoji: '⚡', label: 'En montée', color: '#FF9500' };
  return { emoji: '🌱', label: 'Émergent', color: '#34C759' };
}

const getRefWebsite = (brandName: string) => {
  const k = getBrandKey(brandName || '');
  return Object.entries(REFERENCE_BRAND_WEBSITES).find(([name]) => getBrandKey(name) === k)?.[1];
};

interface TrendProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  style: string;
  imageUrl: string | null;
  segment: string;
  ageRange?: string; // '18-24' ou '25-34'
  zone: string;
  trendScore?: number;
  trendGrowthPercent?: number;
}

export function TrendsByMarket({ initialTrends }: { initialTrends?: TrendProduct[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [isVisible, setIsVisible] = useState(false);
  const [trends, setTrends] = useState<TrendProduct[]>(initialTrends || []);
  const [loading, setLoading] = useState(!initialTrends);
  const [analysesCount, setAnalysesCount] = useState<number | null>(null);
  const [homepageIds, setHomepageIds] = useState<Set<string>>(new Set(initialTrends?.map(t => t.id).filter(Boolean) as string[] || []));

  // Charger les tendances et les infos utilisateur
  useEffect(() => {
    const loadTrends = async () => {
      // Si on a déjà des tendances (via SSR), on ne recharge pas sauf si c'est vide
      if (trends.length === 0) {
        setLoading(true);
        try {
          const trendsRes = await fetch('/api/trends/homepage-featured');

          if (trendsRes.ok) {
            const trendsData = await trendsRes.json();
            const trendsList = trendsData.trends || [];
            setTrends(trendsList);
            const ids = trendsList.map((t: TrendProduct) => t.id).filter(Boolean);
            setHomepageIds(new Set(ids));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des tendances:', error);
        } finally {
          setLoading(false);
        }
      }

      // Toujours vérifier le quota d'analyses si plan free
      if (user?.plan === 'starter') {
        try {
          const analysesRes = await fetch('/api/trends/analyses-count');
          if (analysesRes.ok) {
            const analysesData = await analysesRes.json();
            setAnalysesCount(analysesData.count || 0);
          }
        } catch (e) {
          console.error('Erreur quota analyses:', e);
        }
      }
    };

    loadTrends();
  }, [user?.plan, initialTrends]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('trends-by-market');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const displayedTrends = (() => {
    // Fonction pour diversifier les marques (Round Robin simplifié)
    const diversifyByBrand = (list: TrendProduct[], limit: number) => {
      const result: TrendProduct[] = [];
      const buckets: Record<string, TrendProduct[]> = {};

      // Grouper par marque
      list.forEach(item => {
        const b = item.brand.toLowerCase();
        if (!buckets[b]) buckets[b] = [];
        buckets[b].push(item);
      });

      // Piocher une marque à la fois
      let brandNames = Object.keys(buckets);
      let brandIdx = 0;
      while (result.length < limit && brandNames.length > 0) {
        if (brandIdx >= brandNames.length) brandIdx = 0;

        const currentBrand = brandNames[brandIdx];
        const bucket = buckets[currentBrand];

        if (bucket && bucket.length > 0) {
          const product = bucket.shift();
          if (product) result.push(product);
        }

        if (!bucket || bucket.length === 0) {
          brandNames.splice(brandIdx, 1);
        } else {
          brandIdx = (brandIdx + 1) % brandNames.length;
        }
      }
      return result;
    };

    // Par défaut : Mix 2 Hommes / 2 Femmes (format fixe pour TikTok style)
    const men = diversifyByBrand(trends.filter(t => t.segment === 'homme'), 2);
    const women = diversifyByBrand(trends.filter(t => t.segment === 'femme'), 2);

    return [...men, ...women];
  })();

  const handleAnalyzeClick = (e: React.MouseEvent, trendId: string) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/signin?redirect=/trends/' + trendId);
      return;
    }

    if (user.plan === 'starter' && analysesCount !== null && analysesCount >= 3) {
      router.push('/auth/choose-plan');
      return;
    }

    router.push(`/trends/${trendId}`);
  };

  return (
    <section id="trends-by-market" className="py-12 sm:py-24 lg:py-32 bg-white border-t border-black/[0.03]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* En-tête avec titre et indicateur */}
        <div className="flex flex-col items-center justify-center text-center gap-6 mb-12 lg:mb-20">
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-black leading-[0.9]">
              Tendances sur TikTok
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#007AFF]">
                Détection & Analyse des produits viraux en temps réel
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-red-50/50 to-white rounded-full border border-red-100 mt-4 shadow-sm w-fit">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF2D55]"></span>
            </div>
            <div className="text-left">
              <div className="text-[12px] font-black tracking-widest text-[#FF2D55] uppercase leading-none mb-0.5">
                Radar en Direct
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-black/60">
                Mise à jour en temps réel
              </div>
            </div>
          </div>
        </div>

        {/* Grille de produits animée */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#6e6e73] uppercase tracking-widest">Initialisation du Radar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {displayedTrends.map((product, index) => {
                const segmentLabel = product.segment === 'homme' ? 'Homme' : 'Femme';
                const isFree = user?.plan === 'starter';
                const isPubliclyVisible = !isFree || homepageIds.has(product.id);

                return (
                  <motion.div
                    layout
                    key={`${product.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="group relative w-full mx-auto max-w-[350px] sm:max-w-[320px] lg:max-w-[230px] xl:max-w-[250px]"
                  >
                    <div className="bg-white rounded-[32px] overflow-hidden transition-all duration-500 shadow-apple border border-black/[0.03] flex flex-col h-full hover:shadow-apple-lg hover:-translate-y-2">
                      {isFree && !isPubliclyVisible && (
                        <div className="absolute inset-0 z-40 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6 shadow-apple">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="text-lg font-black text-black mb-4 tracking-tight">Rapport Privé</h4>
                          <Link
                            href="/auth/signup"
                            className="w-full py-3 bg-black text-white rounded-full text-xs font-bold hover:bg-black/90 transition-all active:scale-95 shadow-xl"
                          >
                            Accès Starter
                          </Link>
                        </div>
                      )}

                      <div className={cn("relative flex flex-col h-full bg-white", isFree && !isPubliclyVisible ? 'opacity-10 grayscale' : '')}>
                        <div className="relative aspect-[9/16] overflow-hidden bg-black group-hover:rounded-b-none transition-all">
                          <img
                            src={product.imageUrl || ''}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const proxied = proxyImageUrl(product.imageUrl || '');
                              if (proxied && target.src !== proxied) target.src = proxied;
                            }}
                          />

                          {/* Gradient en bas pour lire le texte proprement */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />

                          {(() => {
                            const score = product.trendScore || 50;
                            const badge = getViralityBadge(score);
                            const brand = safeDisplayBrand(product.brand) || product.brand || 'Marque Inconnue';

                            // Realistic stats based on score
                            const baseLikes = Math.floor(score * 1250 + (product.name.length * 100)); // Range ~ 80K - 150K
                            const baseComments = Math.floor(baseLikes * 0.012);
                            const baseBookmarks = Math.floor(baseLikes * 0.08);
                            const baseShares = Math.floor(baseLikes * 0.035);

                            const formatNum = (n: number) => {
                              if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
                              if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
                              return n.toString();
                            };

                            // Realistic TikTok fashion usernames
                            const creatorNames = [
                              '@clara.outfits', '@lena_style', '@mathilde.ootd', '@julien.drip',
                              '@sarah.fashion', '@lucas_streetwear', '@emilie.finds', '@hugo.styles',
                              '@camille.looks', '@theo.vintage', '@lea.fashionista', '@max.sneakers',
                              '@chloe.wardrobe', '@antoine.fits', '@manon.trends'
                            ];
                            // Pick one deterministically based on product signature/first chars
                            const charCodeSum = (product.name + product.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                            const username = creatorNames[charCodeSum % creatorNames.length];

                            return (
                              <>
                                {/* Interface "TikTok" - Actions à droite */}
                                <div className="absolute right-1 lg:right-2 bottom-2 lg:bottom-3 z-20 flex flex-col items-center gap-1.5 lg:gap-3">
                                  {/* Profile Pic with Follow Button */}
                                  <div className="relative mb-0.5">
                                    <div className="w-[24px] h-[24px] lg:w-[36px] lg:h-[36px] rounded-full border border-white overflow-hidden bg-black flex items-center justify-center">
                                      <img
                                        src={getBrandLogoUrl(brand) || proxyImageUrl(product.imageUrl || '') || ''}
                                        alt={brand}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + brand + '&background=random&color=fff';
                                        }}
                                      />
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[10px] h-[10px] lg:w-[16px] lg:h-[16px] bg-[#FF2D55] rounded-full flex items-center justify-center cursor-pointer shadow-sm">
                                      <span className="text-white text-[7px] lg:text-[10px] font-bold leading-none mb-0.5">+</span>
                                    </div>
                                  </div>

                                  {/* Likes */}
                                  <div className="flex flex-col items-center gap-0.5 cursor-pointer group/btn">
                                    <svg className="w-[18px] h-[18px] lg:w-[26px] lg:h-[26px] text-white transition-transform group-hover/btn:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    <span className="text-white text-[8px] lg:text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      {formatNum(baseLikes)}
                                    </span>
                                  </div>

                                  {/* Comments */}
                                  <div className="flex flex-col items-center gap-0.5 cursor-pointer group/btn">
                                    <svg className="w-[18px] h-[18px] lg:w-[26px] lg:h-[26px] text-white transition-transform group-hover/btn:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0H7V9h2v2z" />
                                    </svg>
                                    <span className="text-white text-[8px] lg:text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      {formatNum(baseComments)}
                                    </span>
                                  </div>

                                  {/* Bookmark */}
                                  <div className="flex flex-col items-center gap-0.5 cursor-pointer group/btn">
                                    <svg className="w-[18px] h-[18px] lg:w-[26px] lg:h-[26px] text-white transition-transform group-hover/btn:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                    </svg>
                                    <span className="text-white text-[8px] lg:text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      {formatNum(baseBookmarks)}
                                    </span>
                                  </div>

                                  {/* Share */}
                                  <div className="flex flex-col items-center gap-0.5 cursor-pointer group/btn">
                                    <svg className="w-[18px] h-[18px] lg:w-[26px] lg:h-[26px] text-white transition-transform group-hover/btn:scale-110 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
                                      <path d="M11 6.914V2.586L20.414 12 11 21.414v-4.328c-4.22-.162-8.312.92-11 5.914 0-6.118 2.653-12.784 11-16.086z" />
                                    </svg>
                                    <span className="text-white text-[8px] lg:text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      {formatNum(baseShares)}
                                    </span>
                                  </div>

                                  {/* Disque Musique - TikTok style */}
                                  <div className="mt-1 lg:mt-2 w-[22px] h-[22px] lg:w-[34px] lg:h-[34px] rounded-full flex items-center justify-center border-[3px] lg:border-[5px] border-[#2c2c2c] bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.1)] animate-[spin_4s_linear_infinite]">
                                    <img
                                      src={getBrandLogoUrl(brand) || proxyImageUrl(product.imageUrl || '') || ''}
                                      alt="Record"
                                      className="w-full h-full rounded-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + brand + '&background=random&color=fff';
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Infos Produit en bas à gauche */}
                                <div className="absolute left-2 lg:left-2 bottom-3 lg:bottom-4 right-[38px] lg:right-[52px] z-20">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[12px] lg:text-[13px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1">
                                      {username}
                                    </span>
                                    <div className="px-1 py-0.5 bg-white/20 backdrop-blur-sm rounded-sm text-[8px] text-white font-bold flex items-center gap-1">
                                      Viral
                                    </div>
                                  </div>

                                  <div className="text-[10px] lg:text-[11px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-snug line-clamp-2">
                                    {(() => {
                                      const cleanName = product.name.toLowerCase();
                                      const captions = [
                                        `J'ai enfin trouvé ça ! 😍 ${cleanName}`,
                                        `POV: tu as trouvé l'indispensable de la saison ✨ (${cleanName})`,
                                        `Je valide à 100% 🔥 : ${cleanName}`,
                                        `Le masterclass absolu pour votre prochaine tenue 💯 : ${cleanName}`,
                                        `Vous validez ? 🥵 ${cleanName}`,
                                        `Je viens de dénicher ce vrai banger 🤯 : ${cleanName}`,
                                        `${cleanName} !! Foncez avant la rupture 🏃‍♂️💨`,
                                        `Comment j'ai pu vivre sans ça avant ? 😭 ${cleanName}`,
                                        `C'est une dinguerie à quel point c'est lourd : ${cleanName}`,
                                        `Alerte pépite !! ${cleanName} ✨`
                                      ];
                                      return captions[charCodeSum % captions.length];
                                    })()}
                                  </div>

                                  <div className="text-[10px] lg:text-[11px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1 line-clamp-1">
                                    <span className="font-bold hover:underline cursor-pointer">#pepite</span>{' '}
                                    <span className="font-bold hover:underline cursor-pointer">#viral</span>{' '}
                                    <span className="font-bold hover:underline cursor-pointer">#fyp</span>{' '}
                                    <span className="font-bold hover:underline cursor-pointer">#pourtoi</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Bouton d'Analyse */}
                        <div className="p-3 bg-white z-30 transition-all">
                          <button
                            onClick={(e) => handleAnalyzeClick(e, product.id)}
                            className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest bg-[#EFEFF0] text-black border border-black/5 shadow-sm hover:bg-[#007AFF] hover:text-white hover:border-[#007AFF] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-[#007AFF] group-hover:text-white"
                          >
                            <span>Analyser la Tendance</span>
                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-16 lg:mt-24 text-center">
          <Link
            href="/trends"
            className="inline-flex items-center gap-4 bg-[#007AFF] px-10 py-5 rounded-full text-white font-black uppercase tracking-widest text-sm shadow-apple hover:shadow-apple-lg hover:-translate-y-1 transition-all group shadow-lg shadow-[#007AFF]/20"
          >
            Analyser le Radar Complet
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
}
