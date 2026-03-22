'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  format,
  addDays,
  addMonths,
  subMonths,
  isBefore,
  isWithinInterval,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, LayoutList, VideoIcon, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { QuotaGenerateButton } from '@/components/usage/QuotaGenerateButton';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import type {
  ContentCalendarEvent,
  ContentCalendarPlatform,
  StructuredPostContent,
  ContentCalendarMeta,
} from '@/app/api/launch-map/calendar/route';

const PLATFORM_LABELS: Record<ContentCalendarPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  autre: 'Autre',
};

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface StructuredPostCreatorProps {
  brandId: string;
  brandName: string;
  onSaved?: () => void;
  initialImageUrl?: string;
}

export function StructuredPostCreator({ brandId, brandName, onSaved, initialImageUrl }: StructuredPostCreatorProps) {
  const { data: calendarData, isLoading: loading, mutate: mutateCalendar } = useSWR<{ events: ContentCalendarEvent[], meta?: ContentCalendarMeta }>(
    brandId ? `/api/launch-map/calendar?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher
  );

  const events = calendarData?.events || [];
  const calendarMeta = calendarData?.meta;

  const { data: frequencyData, isLoading: contentFrequencyLoading } = useSWR<{ maxPostsPerDay: number, label: string, recommendedPostTime: string }>(
    (brandId && !calendarMeta?.contentStrategyFrequency) ? { url: '/api/launch-map/extract-content-frequency', brandId } : null,
    ({ url, brandId }: { url: string, brandId: string }) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    }).then(res => res.json())
  );

  const [selectedHook, setSelectedHook] = useState<string>('');

  const contentFrequency = useMemo(() => {
    if (calendarMeta?.contentStrategyFrequency) {
      const fromMeta = calendarMeta.contentStrategyFrequency;
      return {
        maxPostsPerDay: fromMeta.maxPostsPerDay,
        label: fromMeta.label ?? `${fromMeta.maxPostsPerDay} post${fromMeta.maxPostsPerDay > 1 ? 's' : ''} par jour`,
        recommendedPostTime: fromMeta.recommendedPostTime ?? '18:00',
      };
    }
    if (frequencyData) {
      const max = typeof frequencyData.maxPostsPerDay === 'number' && frequencyData.maxPostsPerDay >= 1 ? Math.min(10, frequencyData.maxPostsPerDay) : 1;
      const label = typeof frequencyData.label === 'string' && frequencyData.label.trim() ? frequencyData.label.trim() : `${max} post${max > 1 ? 's' : ''} par jour`;
      const recommendedPostTime = typeof frequencyData.recommendedPostTime === 'string' && /^\d{2}:\d{2}$/.test(frequencyData.recommendedPostTime) ? frequencyData.recommendedPostTime : '18:00';
      return { maxPostsPerDay: max, label, recommendedPostTime };
    }
    return {
      maxPostsPerDay: 1,
      label: '1 post par jour (par défaut)',
      recommendedPostTime: '18:00',
    };
  }, [calendarMeta?.contentStrategyFrequency, frequencyData]);

  const [saving, setSaving] = useState(false);

  const [clothesReceived, setClothesReceived] = useState<boolean | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const [platform, setPlatform] = useState<ContentCalendarPlatform>('instagram');
  const [formStart, setFormStart] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [formStructured, setFormStructured] = useState<StructuredPostContent>({
    headline: '',
    body: '',
    cta: '',
    hashtags: '',
    description: '',
  });
  const [generateStructuredLoading, setGenerateStructuredLoading] = useState(false);
  const [generateStructuredError, setGenerateStructuredError] = useState<string | null>(null);
  const [isDropOrSalePeriod, setIsDropOrSalePeriod] = useState(false);
  const [showUgcSavingsBannerAfterSave, setShowUgcSavingsBannerAfterSave] = useState(false);



  const saveEvents = useCallback(
    async (nextEvents: ContentCalendarEvent[], options?: { meta?: ContentCalendarMeta; showUgcSavingsBanner?: boolean }) => {
      setSaving(true);
      try {
        const res = await fetch('/api/launch-map/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, events: nextEvents, meta: options?.meta ?? calendarMeta }),
        });
        if (res.ok) {
          mutateCalendar();
          if (options?.showUgcSavingsBanner) setShowUgcSavingsBannerAfterSave(true);
          setFormStructured({ headline: '', body: '', cta: '', hashtags: '', description: '' });
          onSaved?.();
        }
      } finally {
        setSaving(false);
      }
    },
    [brandId, calendarMeta, onSaved, mutateCalendar]
  );

  async function handleGenerate() {
    if (platform === 'autre') return;
    setGenerateStructuredError(null);
    setGenerateStructuredLoading(true);
    try {
      const res = await fetch('/api/launch-map/generate-structured-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, platform, clothesReceived: clothesReceived === true, specificHook: selectedHook }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateStructuredError(data.error || 'Erreur lors de la génération');
        return;
      }
      setFormStructured({
        headline: data.headline ?? '',
        body: data.body ?? '',
        cta: data.cta ?? '',
        hashtags: data.hashtags ?? '',
        description: data.description ?? '',
      });
    } finally {
      setGenerateStructuredLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start = formStart.trim() || todayStr;
    const startDate = parseISO(start);
    const todayStart = startOfDay(new Date());
    if (isBefore(startDate, todayStart)) {
      setGenerateStructuredError('Choisissez aujourd\'hui ou une date future.');
      return;
    }
    if (clothesReceived === true && !isWithinInterval(startDate, { start: new Date(), end: suggestedRangeEnd })) {
      setGenerateStructuredError('Les 7 prochains jours sont recommandés (vous avez reçu vos vêtements).');
      return;
    }
    const maxAllowed = contentFrequency.maxPostsPerDay;
    const dateOnly = start.slice(0, 10);
    const contentOnDay = events.filter((ev) => ev.type === 'content' && ev.start.startsWith(dateOnly)).length;
    if (contentOnDay >= maxAllowed && !isDropOrSalePeriod) {
      setGenerateStructuredError(`Limite : ${contentFrequency.label}. Ce jour a déjà ${contentOnDay} post(s). Cochez « Période drop / vente régulière » pour dépasser.`);
      return;
    }
    const headline = formStructured.headline?.trim() || '';
    const structuredContent: StructuredPostContent = {
      headline: headline || undefined,
      body: formStructured.body?.trim() || undefined,
      cta: formStructured.cta?.trim() || undefined,
      hashtags: formStructured.hashtags?.trim() || undefined,
      description: formStructured.description?.trim() || undefined,
    };
    const postTime = calendarMeta?.contentStrategyFrequency?.recommendedPostTime ?? contentFrequency.recommendedPostTime ?? '18:00';
    const postStart = start.includes('T') ? start : `${dateOnly}T${postTime}`;
    const postPayload: ContentCalendarEvent = {
      id: generateId(),
      type: 'content',
      title: headline || `Post ${PLATFORM_LABELS[platform]}`,
      start: postStart,
      platform,
      structuredContent: headline || structuredContent.body || structuredContent.cta || structuredContent.hashtags || structuredContent.description ? structuredContent : undefined,
    };
    const prodEvent: ContentCalendarEvent = {
      id: generateId(),
      type: 'tournage',
      title: `Prod — Post ${PLATFORM_LABELS[platform]}`,
      start: `${dateOnly}T08:00`,
      platform,
    };
    const isFirstContent = !calendarMeta?.firstContentPostDate && events.filter((ev) => ev.type === 'content').length === 0;
    const nextMeta: ContentCalendarMeta | undefined = isFirstContent ? { ...calendarMeta, firstContentPostDate: dateOnly } : calendarMeta;
    saveEvents([...events, prodEvent, postPayload], { meta: nextMeta, showUgcSavingsBanner: clothesReceived === true });
  }

  const hasContent = formStructured.headline || formStructured.body || formStructured.cta || formStructured.hashtags || formStructured.description;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const suggestedRangeEnd = addDays(new Date(), 6);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const eventsByDate = events.reduce<Record<string, ContentCalendarEvent[]>>((acc, ev) => {
    const d = ev.start.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup open={generateStructuredLoading} title="Génération du post structuré…" />
      {/* Modal : Avez-vous reçu vos vêtements ? */}
      {clothesReceived === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-labelledby="clothes-modal-title">
          <div className="rounded-xl border border-border bg-background p-6 shadow-xl max-w-md w-full text-foreground">
            <h2 id="clothes-modal-title" className="text-lg font-semibold text-foreground mb-2">
              Avez-vous reçu vos vêtements du fournisseur ?
            </h2>
            <p className="text-sm text-foreground/90 mb-4">
              Oui : contenu mettant en avant le vêtement (tournage ou visuels générés). Non : vous créerez le contenu avec notre assistant virtuel. Vous pourrez planifier la date de publication ci-dessous.
            </p>
            <div className="flex gap-3">
              <Button type="button" onClick={() => { setClothesReceived(true); setGenerateStructuredError(null); }} className="flex-1">
                Oui
              </Button>
              <Button type="button" variant="outline" onClick={() => { setClothesReceived(false); setGenerateStructuredError(null); }} className="flex-1">
                Non (pas encore reçu)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bannière économies shooting (après enregistrement) */}
      {showUgcSavingsBannerAfterSave && (
        <div className="rounded-lg border-2 border-emerald-600/50 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 relative">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <VideoIcon className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-foreground">Faites des économies sur vos shootings.</p>
              <p className="text-sm text-foreground/90 mt-0.5">
                Générez des visuels au rendu pro dans Virtual Try-On à moindre coût.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => setShowUgcSavingsBannerAfterSave(false)} aria-label="Fermer">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bannière UGC LAB (quand pas encore reçu) */}
      {clothesReceived === false && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-500/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <VideoIcon className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-foreground">Vous créerez ce contenu avec notre assistant.</p>
              <p className="text-sm text-foreground/90 mt-0.5">Vos posts planifiés apparaîtront dans le Calendrier.</p>
            </div>
          </div>
          <Link href="/launch-map/calendar" className="inline-flex items-center justify-center rounded-lg font-semibold h-10 px-5 text-sm bg-amber-600 text-white hover:bg-amber-700 shrink-0">
            Voir le calendrier
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 items-start">
        {/* Colonne gauche : formulaire */}
        <div className="space-y-4 sm:space-y-6 order-2 md:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <LayoutList className="w-5 h-5" />
                Créer un post structuré
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Générez un post structuré (accroche, corps, CTA, hashtags) à partir de votre stratégie marketing. Choisissez la date sur le calendrier.
              </p>
            </CardHeader>
            <CardContent>
              {clothesReceived === null ? (
                <p className="text-sm text-muted-foreground">Répondez à la question ci-dessus pour continuer.</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Connected Workflow : Image context */}
                  {initialImageUrl && (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#007AFF]/20 bg-[#007AFF]/5 mb-6">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-black/10">
                        <Image src={initialImageUrl} alt="Context" fill unoptimized sizes="64px" className="object-cover" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1D1D1F] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#007AFF]" /> Image importée avec succès</p>
                        <p className="text-[11px] text-[#86868B] mt-0.5">L'IA va s'en inspirer pour créer le bon script.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="struct-platform">Plateforme</Label>
                      <select
                        id="struct-platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as ContentCalendarPlatform)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        {(['instagram', 'tiktok', 'linkedin', 'facebook', 'x'] as const).map((p) => (
                          <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Date de publication</Label>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {formStart ? (
                          <strong className="text-foreground">{format(parseISO(formStart), 'd MMMM yyyy', { locale: fr })}</strong>
                        ) : (
                          'Choisissez un jour sur le calendrier à droite →'
                        )}
                        {clothesReceived === true && formStart && (
                          <>
                            <span className="block text-xs text-primary mt-0.5">Les 7 prochains jours (en surbrillance) sont recommandés.</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">Vous pouvez générer vos visuels dans Virtual Try-On pour économiser sur les shootings physiques.</span>
                          </>
                        )}
                        {clothesReceived === false && (
                          <span className="block text-xs text-muted-foreground mt-0.5">Vos posts planifiés apparaîtront dans le calendrier.</span>
                        )}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Publication prévue à <strong>{(calendarMeta?.contentStrategyFrequency?.recommendedPostTime ?? contentFrequency.recommendedPostTime ?? '18:00').replace(':', 'h')}</strong>. Un créneau « Prod » est ajouté le même jour.
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <QuotaGenerateButton
                      featureKey="ugc_scripts"
                      onClick={handleGenerate}
                      loading={generateStructuredLoading}
                      disabled={platform === 'autre'}
                      title="Scripts Marketing"
                      description="Générez automatiquement un script viral basé sur les données de votre marque et de votre stratégie."
                      buttonText={generateStructuredLoading ? "Génération en cours..." : "Générer ✨"}
                    />
                    {generateStructuredError && <p className="text-xs text-destructive mt-3 font-semibold text-center">{generateStructuredError}</p>}
                  </div>

                  {/* Hooks Viraux */}
                  <div>
                    <Label className="text-xs font-bold text-foreground mb-2 block">Bibliothèque de Hooks Viraux</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {[
                        "POV : Tu viens de sortir la pièce ultime pour l'hiver",
                        "Arrête ton scroll : le secret que les grandes marques te cachent...",
                        "Pourquoi tu ne devrais plus JAMAIS acheter de basique (regarde ça)",
                        "Comment j'ai créé la pièce parfaite en 48h sans aucun compromis",
                        "Cette pièce va être partout dans 2 mois (sois le premier)",
                        "L'erreur fatale que tout le monde fait avec son style..."
                      ].map((hook, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedHook(hook === selectedHook ? '' : hook)}
                          className={cn(
                            "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border",
                            selectedHook === hook ? "bg-[#007AFF] text-white border-[#007AFF] shadow-md shadow-[#007AFF]/20" : "bg-white text-[#1D1D1F] border-black/10 hover:border-black/30 hover:bg-black/5"
                          )}
                        >
                          {hook}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mockup + Champs */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 mt-4">
                    {/* Champs de texte */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-foreground">Titre / Accroche</Label>
                        <div className={cn(
                          "mt-1 rounded-md border px-3 py-2 text-xs min-h-[2.5rem] transition-colors",
                          formStructured.headline ? "bg-background border-input text-foreground font-bold" : "bg-muted/30 border-dashed border-border text-muted-foreground italic flex items-center"
                        )}>
                          {formStructured.headline || selectedHook || 'Le titre généré apparaîtra ici...'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-foreground">Corps du message</Label>
                        <div className={cn(
                          "mt-1 rounded-md border px-3 py-2 text-xs min-h-[4.5rem] whitespace-pre-wrap transition-colors",
                          formStructured.body ? "bg-background border-input text-foreground" : "bg-muted/30 border-dashed border-border text-muted-foreground italic flex items-center"
                        )}>
                          {formStructured.body || 'Le corps du poste généré apparaîtra ici...'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-foreground">Description</Label>
                        <div className={cn(
                          "mt-1 rounded-md border px-3 py-2 text-xs min-h-[2.5rem] transition-colors",
                          formStructured.description ? "bg-background border-input text-foreground" : "bg-muted/30 border-dashed border-border text-muted-foreground italic flex items-center"
                        )}>
                          {formStructured.description || 'La description générée apparaîtra ici...'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-foreground">Call-to-action</Label>
                          <div className={cn(
                            "mt-1 rounded-md border px-3 py-2 text-xs min-h-[2.5rem] transition-colors",
                            formStructured.cta ? "bg-background border-input text-foreground font-semibold text-[#007AFF]" : "bg-muted/30 border-dashed border-border text-muted-foreground italic flex items-center"
                          )}>
                            {formStructured.cta || 'En attente...'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground">Hashtags</Label>
                          <div className={cn(
                            "mt-1 rounded-md border px-3 py-2 text-xs min-h-[2.5rem] transition-colors text-[#007AFF]",
                            formStructured.hashtags ? "bg-background border-input" : "bg-muted/30 border-dashed border-border text-muted-foreground italic flex items-center"
                          )}>
                            {formStructured.hashtags || 'En attente...'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mockup mobile : visible en dessous des champs sur petit écran, côté droit sur md+ */}
                    <div className="md:hidden mt-4">
                      <p className="text-xs font-bold text-muted-foreground mb-2 text-center uppercase tracking-wide">Aperçu Reel</p>
                      <div className="w-[200px] h-[355px] bg-black rounded-[24px] border-[5px] border-black overflow-hidden relative shadow-xl mx-auto">
                        {initialImageUrl ? (
                          <Image src={initialImageUrl} alt="Reel bg" fill unoptimized sizes="200px" className="object-cover opacity-90" />
                        ) : (
                          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                            <VideoIcon className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 h-[180px] bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 p-3 pb-4 flex flex-col justify-end">
                          <p className="text-white text-[11px] font-bold drop-shadow-md line-clamp-2">
                            {formStructured.headline || selectedHook || "Votre accroche..."}
                          </p>
                          <span className="text-white/70 text-[9px] mt-0.5">{brandName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Aperçu en condition réelle (Mockup) — desktop only */}
                    <div className="hidden md:block">
                      <div className="w-[280px] h-[500px] bg-black rounded-[32px] border-[6px] border-black overflow-hidden relative shadow-2xl shrink-0 mx-auto">
                        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/50 to-transparent z-10" />

                        {/* Background Image / Placeholder */}
                        {initialImageUrl ? (
                          <Image src={initialImageUrl} alt="Reel bg" fill unoptimized sizes="280px" className="object-cover opacity-90" />
                        ) : (
                          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                            <VideoIcon className="w-12 h-12 text-white/20" />
                          </div>
                        )}

                        {/* Gradient Bottom overlay */}
                        <div className="absolute bottom-0 inset-x-0 h-[280px] bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                        {/* UI Elements overlay */}
                        <div className="absolute inset-0 p-4 pb-6 flex flex-col justify-end">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              {/* User Info */}
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden">
                                  {brandName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white text-[13px] font-bold drop-shadow-md">{brandName}</span>
                              </div>
                              {/* Content preview */}
                              <div>
                                <p className="text-white text-[13px] font-medium leading-snug drop-shadow-md line-clamp-2">
                                  {formStructured.headline || selectedHook || "L'accroche de votre vidéo s'affichera ici pour capter l'attention..."}
                                </p>
                                {(formStructured.body || formStructured.hashtags) && (
                                  <p className="text-white/80 text-[11px] leading-tight mt-1 line-clamp-2 drop-shadow-md">
                                    {formStructured.body} {formStructured.hashtags}
                                  </p>
                                )}
                              </div>
                              {/* Sound track */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="w-3 h-3 rounded-sm bg-white/80 flex items-center justify-center"><Sparkles className="w-2 h-2 text-black" /></span>
                                <span className="text-white/80 text-[10px]">Son original - {brandName}</span>
                              </div>
                            </div>

                            {/* Right side action buttons mockup */}
                            <div className="space-y-4 flex flex-col items-center">
                              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-white text-lg font-bold select-none text-center leading-none mt-[-2px]">♡</span>
                              </div>
                              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-white text-xs font-bold select-none">💬</span>
                              </div>
                              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-white text-xs font-bold select-none">↗</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="struct-drop" checked={isDropOrSalePeriod} onChange={(e) => setIsDropOrSalePeriod(e.target.checked)} className="rounded border-input text-primary focus:ring-primary" />
                    <Label htmlFor="struct-drop" className="cursor-pointer text-xs font-medium">
                      Période drop / vente régulière (autoriser plusieurs posts ce jour)
                    </Label>
                  </div>
                  {contentFrequencyLoading ? (
                    <p className="text-xs text-muted-foreground">Chargement de la fréquence…</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Limite selon votre stratégie : <strong>{contentFrequency.label}</strong></p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={saving || !hasContent} size="sm" className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {saving ? 'Enregistrement...' : 'Enregistrer dans le calendrier'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormStructured({ headline: '', body: '', cta: '', hashtags: '', description: '' });
                        setFormStart(todayStr);
                        setGenerateStructuredError(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            <Link href="/launch-map/calendar" className="text-primary hover:underline font-medium">
              Accéder au calendrier complet →
            </Link>
          </p>
        </div>

        {/* Colonne droite : calendrier */}
        <div className="order-1 md:order-2 md:sticky md:top-4">
          <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
            <CardHeader className="pb-4 pt-2 px-2 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 uppercase tracking-wide text-muted-foreground font-medium">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[key] ?? [];
                  const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isInSuggested7Days = clothesReceived === true && !isPast && isWithinInterval(day, { start: new Date(), end: suggestedRangeEnd });
                  const isChosenForPost = formStart && formStart.startsWith(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        if (isPast) return;
                        setSelectedDate(day);
                        setFormStart(key);
                      }}
                      className={cn(
                        'aspect-square rounded-full flex flex-col items-center justify-center relative transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-md scale-105 z-10'
                          : 'hover:bg-muted text-foreground',
                        isPast && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                        !isSelected && isToday && 'bg-accent/50 text-accent-foreground font-medium',
                        !isSelected && !isPast && isInSuggested7Days && 'bg-primary/5 text-primary font-medium ring-1 ring-primary/20',
                        !isSelected && !isPast && isChosenForPost && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      {format(day, 'd')}
                      {dayEvents.length > 0 && (
                        <span className={cn(
                          "absolute bottom-1 w-1 h-1 rounded-full",
                          isSelected ? "bg-primary-foreground" : "bg-primary"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Jour sélectionné : {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Événements du jour sélectionné */}
          {selectedDate && (() => {
            const dateKey = format(selectedDate, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateKey] ?? [];
            if (dayEvents.length === 0) return null;
            return (
              <Card className="mt-4">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    Événements du {format(selectedDate, 'd MMM yyyy', { locale: fr })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {dayEvents.map((ev) => {
                      const ext = ev as ContentCalendarEvent & { structuredContent?: StructuredPostContent };
                      return (
                        <li key={ev.id} className="text-xs flex items-center gap-2 p-2 rounded-md bg-muted/30">
                          <LayoutList className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span className="font-medium truncate">{ev.title}</span>
                          {ext.platform && (
                            <span className="shrink-0 text-muted-foreground">{PLATFORM_LABELS[ext.platform]}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
