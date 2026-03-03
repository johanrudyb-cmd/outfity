'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  parseISO,
  addDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  FileEdit,
  MessageSquare,
  Trash2,
  Loader2,
} from 'lucide-react';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { cn } from '@/lib/utils';
import type { ContentCalendarEvent, ContentCalendarEventType, ContentCalendarPlatform, StructuredPostContent, ContentCalendarMeta } from '@/app/api/launch-map/calendar/route';
import { Sparkles, LayoutList } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<ContentCalendarEventType, string> = {
  tournage: 'Tournage',
  post: 'Post-production',
  content: 'Contenu / Script',
};

const EVENT_TYPE_ICONS: Record<ContentCalendarEventType, typeof Video> = {
  tournage: Video,
  post: FileEdit,
  content: MessageSquare,
};

const EVENT_TYPE_COLORS: Record<ContentCalendarEventType, { text: string; bg: string; dot: string; shadow: string }> = {
  tournage: { text: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10', dot: 'bg-[#FF9500]', shadow: 'shadow-[#FF9500]/20' },
  post: { text: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/10', dot: 'bg-[#AF52DE]', shadow: 'shadow-[#AF52DE]/20' },
  content: { text: 'text-[#34C759]', bg: 'bg-[#34C759]/10', dot: 'bg-[#34C759]', shadow: 'shadow-[#34C759]/20' },
};

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

/** Affiche la date (et l'heure si présente) d'un événement. */
function formatEventStart(start: string): string {
  const datePart = start.slice(0, 10);
  if (start.includes('T') && start.length >= 16) {
    const timePart = start.slice(11, 16);
    return `${datePart} à ${timePart.replace(':', 'h')}`;
  }
  return datePart;
}

interface GeneratedPostItem {
  platform: ContentCalendarPlatform;
  text: string;
}

export function ContentCalendarView({
  brandId,
  brandName = '',
  allPhasesDone = false,
}: {
  brandId: string;
  brandName?: string;
  allPhasesDone?: boolean;
}) {
  const [events, setEvents] = useState<ContentCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [formType, setFormType] = useState<ContentCalendarEventType>('content');
  const [formTitle, setFormTitle] = useState('');
  const [formScript, setFormScript] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formPlatform, setFormPlatform] = useState<ContentCalendarPlatform | ''>('');

  const [showStructuredForm, setShowStructuredForm] = useState(false);
  const [formStructured, setFormStructured] = useState<StructuredPostContent>({ headline: '', body: '', cta: '', hashtags: '', description: '' });
  const [generateStructuredLoading, setGenerateStructuredLoading] = useState(false);
  const [generateStructuredError, setGenerateStructuredError] = useState<string | null>(null);
  const [isDropOrSalePeriod, setIsDropOrSalePeriod] = useState(false);
  const [calendarMeta, setCalendarMeta] = useState<ContentCalendarMeta | undefined>(undefined);
  /** Fréquence + heure de post issue de la stratégie de contenu (IA). */
  const [contentFrequency, setContentFrequency] = useState<{ maxPostsPerDay: number; label: string; recommendedPostTime?: string }>({
    maxPostsPerDay: 1,
    label: '1 post par jour (par défaut)',
    recommendedPostTime: '18:00',
  });
  const [contentFrequencyLoading, setContentFrequencyLoading] = useState(false);

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPostItem[]>([]);
  const [generatePostsLoading, setGeneratePostsLoading] = useState(false);
  const [generatePostsError, setGeneratePostsError] = useState<string | null>(null);
  const [postScheduleDate, setPostScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/launch-map/calendar?brandId=${encodeURIComponent(brandId)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.events)) {
        setEvents(data.events);
      }
      if (res.ok && data.meta) {
        setCalendarMeta(data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Adapter la limite de posts/jour selon la stratégie de contenu (IA) — pas une limite fixe pour tout le monde.
  useEffect(() => {
    if (loading || !brandId) return;
    const fromMeta = calendarMeta?.contentStrategyFrequency;
    if (fromMeta && fromMeta.maxPostsPerDay >= 1) {
      setContentFrequency({
        maxPostsPerDay: fromMeta.maxPostsPerDay,
        label: fromMeta.label ?? `${fromMeta.maxPostsPerDay} post${fromMeta.maxPostsPerDay > 1 ? 's' : ''} par jour`,
        recommendedPostTime: fromMeta.recommendedPostTime ?? '18:00',
      });
      return;
    }
    let cancelled = false;
    setContentFrequencyLoading(true);
    fetch('/api/launch-map/extract-content-frequency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const max = typeof data.maxPostsPerDay === 'number' && data.maxPostsPerDay >= 1 ? Math.min(10, data.maxPostsPerDay) : 1;
        const label = typeof data.label === 'string' && data.label.trim() ? data.label.trim() : `${max} post${max > 1 ? 's' : ''} par jour`;
        const recommendedPostTime = typeof data.recommendedPostTime === 'string' && /^\d{2}:\d{2}$/.test(data.recommendedPostTime) ? data.recommendedPostTime : '18:00';
        setContentFrequency({ maxPostsPerDay: max, label, recommendedPostTime });
        setCalendarMeta((prev) => ({
          ...prev,
          contentStrategyFrequency: { maxPostsPerDay: max, label, recommendedPostTime },
        }));
      })
      .catch(() => {
        if (!cancelled) setContentFrequency({ maxPostsPerDay: 1, label: '1 post par jour (par défaut)' });
      })
      .finally(() => {
        if (!cancelled) setContentFrequencyLoading(false);
      });
    return () => { cancelled = true; };
  }, [brandId, loading, calendarMeta?.contentStrategyFrequency]);

  const saveEvents = useCallback(
    async (nextEvents: ContentCalendarEvent[], options?: { meta?: ContentCalendarMeta }) => {
      setSaving(true);
      try {
        const res = await fetch('/api/launch-map/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, events: nextEvents, meta: options?.meta ?? calendarMeta }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.events)) {
          setEvents(data.events);
          if (data.meta) setCalendarMeta(data.meta);
          setShowForm(false);
          setEditingId(null);
          setShowStructuredForm(false);
          resetForm();
        }
      } finally {
        setSaving(false);
      }
    },
    [brandId, calendarMeta]
  );

  function resetForm() {
    setFormType('content');
    setFormTitle('');
    setFormScript('');
    setFormStart('');
    setFormEnd('');
    setFormPlatform('');
    setShowStructuredForm(false);
    setFormStructured({ headline: '', body: '', cta: '', hashtags: '', description: '' });
  }

  function openFormForDate(date: Date) {
    setFormStart(format(date, 'yyyy-MM-dd'));
    setFormEnd('');
    setFormTitle('');
    setFormScript('');
    setFormType('content');
    setEditingId(null);
    setShowForm(true);
  }

  function openFormForEdit(evt: ContentCalendarEvent) {
    const extended = evt as ContentCalendarEvent & { structuredContent?: StructuredPostContent };
    setEditingId(evt.id);
    setFormType(evt.type);
    setFormTitle(evt.title);
    setFormScript(evt.script ?? '');
    setFormStart(evt.start.slice(0, 10));
    setFormEnd(evt.end?.slice(0, 10) ?? '');
    setFormPlatform(extended.platform ?? '');
    if (extended.structuredContent) {
      setShowStructuredForm(true);
      setFormStructured({
        headline: extended.structuredContent.headline ?? '',
        body: extended.structuredContent.body ?? '',
        cta: extended.structuredContent.cta ?? '',
        hashtags: extended.structuredContent.hashtags ?? '',
        description: extended.structuredContent.description ?? '',
      });
    } else {
      setShowStructuredForm(false);
      setFormStructured({ headline: '', body: '', cta: '', hashtags: '', description: '' });
    }
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start = formStart.trim() || format(new Date(), 'yyyy-MM-dd');
    const payload: ContentCalendarEvent = {
      id: editingId ?? generateId(),
      type: formType,
      title: formTitle.trim() || EVENT_TYPE_LABELS[formType],
      script: formScript.trim() || undefined,
      start,
      end: formEnd.trim() || undefined,
      platform: formPlatform && formType === 'content' ? (formPlatform as ContentCalendarPlatform) : undefined,
    };
    if (editingId) {
      const next = events.map((ev) => (ev.id === editingId ? payload : ev));
      saveEvents(next);
    } else {
      saveEvents([...events, payload]);
    }
  }

  async function handleGenerateStructuredPost() {
    const platform = (formPlatform || 'instagram') as ContentCalendarPlatform;
    if (platform === 'autre') return;
    setGenerateStructuredError(null);
    setGenerateStructuredLoading(true);
    try {
      const res = await fetch('/api/launch-map/generate-structured-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          platform,
          clothesReceived: false,
        }),
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  function handleStructuredSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      doSaveStructuredPost();
      return;
    }
    const start = formStart.trim() || todayStr;
    if (!formStart.trim()) {
      setGenerateStructuredError('Choisissez une date.');
      return;
    }
    const startDate = parseISO(start);
    const todayStart = startOfDay(new Date());
    if (isBefore(startDate, todayStart)) {
      setGenerateStructuredError('Choisissez aujourd\'hui ou une date future.');
      return;
    }
    const maxAllowed = contentFrequency.maxPostsPerDay;
    const dateOnly = start.slice(0, 10);
    const contentOnDay = events.filter((ev) => ev.type === 'content' && ev.start.startsWith(dateOnly)).length;
    if (contentOnDay >= maxAllowed && !isDropOrSalePeriod) {
      setGenerateStructuredError(`Limite : ${contentFrequency.label}. Ce jour a déjà ${contentOnDay} post(s). Cochez « Période drop / vente régulière » pour dépasser.`);
      return;
    }
    doSaveStructuredPost();
  }

  function doSaveStructuredPost() {
    const startDate = formStart.trim() || todayStr;
    const dateOnly = startDate.slice(0, 10);
    const platform = (formPlatform || 'instagram') as ContentCalendarPlatform;
    const headline = formStructured.headline?.trim() || '';
    const structuredContent: StructuredPostContent = {
      headline: headline || undefined,
      body: formStructured.body?.trim() || undefined,
      cta: formStructured.cta?.trim() || undefined,
      hashtags: formStructured.hashtags?.trim() || undefined,
      description: formStructured.description?.trim() || undefined,
    };
    const postTime = calendarMeta?.contentStrategyFrequency?.recommendedPostTime ?? contentFrequency.recommendedPostTime ?? '18:00';
    const postStart = startDate.includes('T') ? startDate : `${dateOnly}T${postTime}`;

    const postPayload: ContentCalendarEvent = {
      id: editingId ?? generateId(),
      type: 'content',
      title: headline || `Post ${PLATFORM_LABELS[platform]}`,
      start: postStart,
      platform,
      structuredContent: headline || structuredContent.body || structuredContent.cta || structuredContent.hashtags || structuredContent.description ? structuredContent : undefined,
    };

    const isFirstContent = !calendarMeta?.firstContentPostDate && events.filter((ev) => ev.type === 'content').length === 0 && !editingId;
    const nextMeta: ContentCalendarMeta | undefined = isFirstContent ? { ...calendarMeta, firstContentPostDate: dateOnly } : calendarMeta;

    if (editingId) {
      saveEvents(events.map((ev) => (ev.id === editingId ? postPayload : ev)));
    } else {
      const prodEvent: ContentCalendarEvent = {
        id: generateId(),
        type: 'tournage',
        title: `Prod — Post ${PLATFORM_LABELS[platform]}`,
        start: `${dateOnly}T08:00`,
        platform,
      };
      saveEvents([...events, prodEvent, postPayload], { meta: nextMeta });
    }
  }

  function handleDelete(id: string) {
    if (confirm('Supprimer cet événement ?')) {
      saveEvents(events.filter((ev) => ev.id !== id));
    }
  }

  // Drag and Drop Logic
  function handleDragStart(e: React.DragEvent<HTMLLIElement>, eventId: string) {
    e.dataTransfer.setData('eventId', eventId);
    e.currentTarget.style.opacity = '0.5';
  }

  function handleDragEnd(e: React.DragEvent<HTMLLIElement>) {
    e.currentTarget.style.opacity = '1';
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.currentTarget.classList.add('bg-black/5');
  }

  function handleDragLeave(e: React.DragEvent<HTMLButtonElement>) {
    e.currentTarget.classList.remove('bg-black/5');
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>, targetDateStr: string) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-black/5');

    // Check if dragging to a valid date (not past)
    if (isBefore(parseISO(targetDateStr), startOfDay(new Date()))) {
      return;
    }

    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    // Update the event's start date
    const updatedEvents = events.map(ev => {
      if (ev.id === eventId) {
        // preserve the time if it exists
        const timePart = ev.start.includes('T') ? ev.start.substring(10) : '';
        return { ...ev, start: `${targetDateStr}${timePart}` };
      }
      return ev;
    });

    saveEvents(updatedEvents);
  }

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

  const filteredEvents = selectedDate
    ? events.filter((ev) => ev.start.startsWith(format(selectedDate, 'yyyy-MM-dd')))
    : [...events].sort((a, b) => a.start.localeCompare(b.start));

  async function handleGeneratePosts() {
    setGeneratePostsError(null);
    setGeneratePostsLoading(true);
    try {
      const res = await fetch('/api/launch-map/generate-posts-from-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeneratedPosts([]);
        setGeneratePostsError(data.error || 'Erreur lors de la génération');
        return;
      }
      if (Array.isArray(data.posts)) {
        setGeneratedPosts(
          data.posts.map((p: { platform: string; text: string }) => ({
            platform: (p.platform === 'x' || p.platform === 'instagram' || p.platform === 'tiktok' || p.platform === 'linkedin' || p.platform === 'facebook' ? p.platform : 'autre') as ContentCalendarPlatform,
            text: p.text,
          }))
        );
      }
    } finally {
      setGeneratePostsLoading(false);
    }
  }

  async function handleAutoScheduleAll(posts: GeneratedPostItem[]) {
    if (posts.length === 0) return;

    // Trouver la date du dernier post existant pour reprendre le planning à la suite
    const lastContentEvent = [...events]
      .filter(ev => ev.type === 'content')
      .sort((a, b) => a.start.localeCompare(b.start))
      .pop();

    let startDate = addDays(new Date(), 1); // Par défaut, demain
    if (lastContentEvent) {
      const lastDate = parseISO(lastContentEvent.start.slice(0, 10));
      const nextAvailableDate = addDays(lastDate, 1);
      // On commence soit demain, soit après le dernier post s'il est plus loin
      if (isBefore(startDate, nextAvailableDate)) {
        startDate = nextAvailableDate;
      }
    }

    const newEvents: ContentCalendarEvent[] = [];
    let currentDate = startDate;

    // Simple spacing algorithm: roughly space them out depending on how many there are
    // Wait at least 'daysBetweenPosts' between each post
    const daysBetweenPosts = Math.max(1, Math.floor(30 / posts.length));

    posts.forEach((post, index) => {
      // Create publish event
      const publishDate = format(currentDate, 'yyyy-MM-dd');
      const postEvent: ContentCalendarEvent = {
        id: generateId(),
        type: 'content',
        title: `Post ${PLATFORM_LABELS[post.platform]}`,
        script: post.text,
        start: publishDate,
        platform: post.platform,
      };

      // Also add a production/shooting event 2 days before posting
      const prodDateDate = addDays(currentDate, -2);
      // Ensure prod date is not in the past
      if (!isBefore(startOfDay(prodDateDate), startOfDay(new Date()))) {
        const prodEvent: ContentCalendarEvent = {
          id: generateId(),
          type: 'tournage',
          title: `Tournage — ${PLATFORM_LABELS[post.platform]}`,
          start: format(prodDateDate, 'yyyy-MM-dd'),
          platform: post.platform,
        };
        newEvents.push(prodEvent);
      }

      newEvents.push(postEvent);

      // Advance the date for next post
      currentDate = addDays(currentDate, daysBetweenPosts);
    });

    await saveEvents([...events, ...newEvents]);
    setGeneratedPosts([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup open={generatePostsLoading} title="Génération des posts…" />
      <GenerationLoadingPopup open={generateStructuredLoading} title="Génération du post structuré…" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Colonne gauche : contenu, formulaires, liste */}
        <div className="space-y-6 order-2 xl:order-1">
          {/* Créer des posts depuis la stratégie de contenu */}
          {allPhasesDone && (
            <div className="bg-[#007AFF]/5 rounded-[24px] sm:rounded-[32px] border border-[#007AFF]/10 p-5 sm:p-8">
              <div className="mb-4">
                <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#007AFF]" />
                  Posts depuis votre stratégie de contenu
                </h2>
                <p className="text-sm text-[#86868B] mt-1">
                  Générez des posts adaptés à chaque plateforme (Instagram, TikTok, LinkedIn, Facebook, X) à partir de votre stratégie, puis ajoutez-les au calendrier à la date de votre choix.
                </p>
              </div>
              <div className="space-y-4">
                {generatedPosts.length === 0 ? (
                  <Button
                    type="button"
                    onClick={handleGeneratePosts}
                    disabled={generatePostsLoading}
                    variant="secondary"
                    className="gap-2"
                  >
                    {generatePostsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Générer des posts par plateforme
                    <GenerationCostBadge feature="launch_map_posts_from_strategy" />
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.06] shadow-apple-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1D1D1F]">
                          {generatedPosts.length} posts générés !
                        </h3>
                        <p className="text-[13px] text-[#86868B] mt-1">
                          L'IA va automatiquement les étaler de façon optimale sur le mois à venir, en ajoutant même des rappels de tournage 48h avant chaque post.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoScheduleAll(generatedPosts)}
                        disabled={saving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold bg-[#007AFF] text-white hover:bg-[#007AFF]/90 active:scale-95 transition-all shadow-apple shrink-0"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                        Planifier Automatiquement
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-black/10">
                      {generatedPosts.map((post, idx) => (
                        <div
                          key={`${post.platform}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border border-black/[0.06] bg-white/50"
                        >
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/5 text-[#1D1D1F] shrink-0 w-fit">
                            {PLATFORM_LABELS[post.platform]}
                          </span>
                          <p className="text-[13px] text-[#1D1D1F]/80 flex-1 leading-relaxed">"{post.text}"</p>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="text-[13px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors" onClick={() => setGeneratedPosts([])}>
                      Annuler et supprimer ces idées
                    </button>
                  </div>
                )}
                {generatePostsError && (
                  <p className="text-sm text-[#FF3B30]">{generatePostsError}</p>
                )}
              </div>
            </div>
          )}

          {/* Boutons ajouter + formulaire */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormStart(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
                setEditingId(null);
                setShowStructuredForm(false);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold bg-[#1D1D1F] text-white hover:bg-[#1D1D1F]/90 active:scale-95 transition-all shadow-apple"
            >
              <Plus className="w-4 h-4" />
              Ajouter un événement
            </button>
            <Link
              href="/launch-map/phase/5"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold bg-[#007AFF] text-white hover:bg-[#007AFF]/90 active:scale-95 transition-all shadow-apple"
            >
              <LayoutList className="w-4 h-4" />
              Créer un post structuré
            </Link>
            {selectedDate && (
              <span className="text-sm text-muted-foreground">
                Jour sélectionné : {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
              </span>
            )}
          </div>

          {showForm && showStructuredForm && editingId && (
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple p-5 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
                  <LayoutList className="w-5 h-5 text-[#007AFF]" />
                  {editingId ? 'Modifier le post structuré' : 'Nouveau post structuré'}
                </h2>
                <p className="text-sm text-[#86868B] mt-1.5">
                  Le contenu est généré par l'IA à partir de votre stratégie (champs grisés, non modifiables). Choisissez la date de publication en cliquant sur un jour dans le calendrier à droite.
                </p>
              </div>
              <div>
                <form onSubmit={handleStructuredSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="struct-platform" className="text-xs font-bold text-[#86868B] uppercase tracking-wider">Plateforme</Label>
                      <select
                        id="struct-platform"
                        value={formPlatform || 'instagram'}
                        onChange={(e) => setFormPlatform(e.target.value as ContentCalendarPlatform)}
                        className="mt-1.5 w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#007AFF]/20"
                        required
                      >
                        {(Object.keys(PLATFORM_LABELS) as ContentCalendarPlatform[]).map((p) => (
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
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Publication prévue à <strong>{(calendarMeta?.contentStrategyFrequency?.recommendedPostTime ?? contentFrequency.recommendedPostTime ?? '18:00').replace(':', 'h')}</strong>. Un créneau « Prod » est ajouté le même jour.
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-foreground mb-2">Génération par IA</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Générez le contenu du post (titre, corps, description, CTA, hashtags) à partir de votre stratégie complète. Les champs générés sont fixes (non modifiables).
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateStructuredPost}
                      disabled={generateStructuredLoading || formPlatform === 'autre'}
                      className="gap-2"
                    >
                      {generateStructuredLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Générer le contenu avec l&apos;IA
                      <GenerationCostBadge feature="launch_map_structured_post" />
                    </Button>
                    {generateStructuredError && (
                      <p className="text-xs text-destructive mt-2">{generateStructuredError}</p>
                    )}
                  </div>
                  <div>
                    <Label>Titre / Accroche</Label>
                    <div className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem]">
                      {formStructured.headline || '— Généré par l\'IA —'}
                    </div>
                  </div>
                  <div>
                    <Label>Corps du message</Label>
                    <div className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-[5rem] whitespace-pre-wrap">
                      {formStructured.body || '— Généré par l\'IA —'}
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <div className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem]">
                      {formStructured.description || '— Généré par l\'IA —'}
                    </div>
                  </div>
                  <div>
                    <Label>Call-to-action (CTA)</Label>
                    <div className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem]">
                      {formStructured.cta || '— Généré par l\'IA —'}
                    </div>
                  </div>
                  <div>
                    <Label>Hashtags</Label>
                    <div className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-[2.5rem]">
                      {formStructured.hashtags || '— Généré par l\'IA —'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="struct-drop"
                      checked={isDropOrSalePeriod}
                      onChange={(e) => setIsDropOrSalePeriod(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="struct-drop" className="cursor-pointer text-sm">
                      Période drop / vente régulière (autoriser plusieurs posts ce jour)
                    </Label>
                  </div>
                  {contentFrequencyLoading ? (
                    <p className="text-xs text-muted-foreground">Chargement de la fréquence depuis votre stratégie de contenu…</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Limite selon votre stratégie de contenu : <strong>{contentFrequency.label}</strong></p>
                  )}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-full bg-[#1D1D1F] px-6 py-2.5 text-[13px] font-bold text-white shadow-apple hover:bg-[#1D1D1F]/90 transition-all active:scale-95 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); setShowStructuredForm(false); resetForm(); }}
                      className="inline-flex items-center justify-center rounded-full bg-[#F5F5F7] px-6 py-2.5 text-[13px] font-bold text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all active:scale-95"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showForm && !showStructuredForm && (
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple p-5 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#1D1D1F]">{editingId ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
              </div>
              <div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cal-type">Type</Label>
                      <select
                        id="cal-type"
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as ContentCalendarEventType)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {(Object.keys(EVENT_TYPE_LABELS) as ContentCalendarEventType[]).map((t) => (
                          <option key={t} value={t}>
                            {EVENT_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="cal-title">Titre</Label>
                      <Input
                        id="cal-title"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Ex. Tournage lookbook"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {formType === 'content' && (
                    <div>
                      <Label htmlFor="cal-platform">Plateforme (optionnel)</Label>
                      <select
                        id="cal-platform"
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value as ContentCalendarPlatform | '')}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        {(Object.keys(PLATFORM_LABELS) as ContentCalendarPlatform[]).map((p) => (
                          <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="cal-script">Script / description (optionnel)</Label>
                    <textarea
                      id="cal-script"
                      value={formScript}
                      onChange={(e) => setFormScript(e.target.value)}
                      placeholder="Idées de script, notes pour le contenu..."
                      rows={3}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="cal-start" className="text-xs font-bold text-[#86868B] uppercase tracking-wider">Date de début</Label>
                      <Input
                        id="cal-start"
                        type="date"
                        value={formStart}
                        onChange={(e) => setFormStart(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#007AFF]/20 h-auto"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cal-end" className="text-xs font-bold text-[#86868B] uppercase tracking-wider">Date de fin (optionnel)</Label>
                      <Input
                        id="cal-end"
                        type="date"
                        value={formEnd}
                        onChange={(e) => setFormEnd(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#007AFF]/20 h-auto"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-full bg-[#1D1D1F] px-6 py-2.5 text-[13px] font-bold text-white shadow-apple hover:bg-[#1D1D1F]/90 transition-all active:scale-95 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }} className="inline-flex items-center justify-center rounded-full bg-[#F5F5F7] px-6 py-2.5 text-[13px] font-bold text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all active:scale-95">
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Liste des événements */}
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1D1D1F]">
                {selectedDate ? `Événements du ${format(selectedDate, 'd MMM yyyy', { locale: fr })}` : 'Tous les événements'}
              </h2>
            </div>
            <div>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-10 bg-[#F5F5F7] rounded-3xl border border-dashed border-black/[0.1] text-[#86868B] text-[13px] font-medium">
                  Aucun événement. Ajoutez des créneaux de tournage, post-production, scripts ou CTA UGC.
                </div>
              ) : (
                <ul className="space-y-4">
                  {filteredEvents.map((ev) => {
                    const Icon = EVENT_TYPE_ICONS[ev.type];
                    const extended = ev as ContentCalendarEvent & { structuredContent?: StructuredPostContent };
                    const structured = extended.structuredContent;

                    if (structured && (structured.headline || structured.body || structured.cta || structured.hashtags || structured.description)) {
                      return (
                        <li
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onDragEnd={handleDragEnd}
                          className="rounded-[20px] sm:rounded-[24px] border border-[#007AFF]/10 bg-white shadow-sm overflow-hidden cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-transform"
                        >
                          <div className="p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#007AFF]/10 text-[#007AFF]">
                                  <LayoutList className="w-4 h-4" />
                                  Post structuré
                                </span>
                                {extended.platform && (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#1D1D1F]/5 text-[#1D1D1F]">
                                    {PLATFORM_LABELS[extended.platform]}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-[#86868B] ml-2">
                                  {formatEventStart(ev.start)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => openFormForEdit(ev)} className="text-[12px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                                  Modifier
                                </button>
                                <button type="button" onClick={() => handleDelete(ev.id)} aria-label="Supprimer" className="text-[#86868B] hover:text-[#FF3B30] transition-colors p-2">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {structured.headline && (
                              <p className="font-bold text-[16px] text-[#1D1D1F]">{structured.headline}</p>
                            )}
                            {structured.body && (
                              <p className="text-[14px] leading-relaxed text-[#1D1D1F]/80 whitespace-pre-wrap">{structured.body}</p>
                            )}
                            {structured.description && (
                              <p className="text-[13px] text-[#86868B] italic">{structured.description}</p>
                            )}
                            {structured.cta && (
                              <p className="text-[14px] text-[#007AFF] font-semibold">{structured.cta}</p>
                            )}
                            {structured.hashtags && (
                              <p className="text-[13px] text-[#86868B]">{structured.hashtags}</p>
                            )}
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li
                        key={ev.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ev.id)}
                        onDragEnd={handleDragEnd}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[20px] sm:rounded-[24px] border border-black/[0.06] bg-white hover:shadow-apple-sm transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-wrap flex-1">
                          <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", EVENT_TYPE_COLORS[ev.type].bg, EVENT_TYPE_COLORS[ev.type].text)}>
                            <Icon className="w-4 h-4" />
                            {EVENT_TYPE_LABELS[ev.type]}
                          </span>
                          {(ev as { platform?: ContentCalendarPlatform }).platform && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/5 text-[#86868B]">
                              {PLATFORM_LABELS[(ev as { platform: ContentCalendarPlatform }).platform]}
                            </span>
                          )}
                          <span className="font-bold text-[14px] text-[#1D1D1F] truncate pr-4">{ev.title}</span>
                          {ev.script && (
                            <p className="text-[13px] text-[#86868B] line-clamp-1 flex-1 min-w-[150px]">{ev.script}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 sm:ml-auto">
                          <div className="text-[12px] font-semibold text-[#86868B]">
                            {formatEventStart(ev.start)}
                            {ev.end && ` → ${formatEventStart(ev.end)}`}
                          </div>
                          <div className="flex items-center gap-1 border-l border-black/5 pl-4">
                            <button type="button" onClick={() => openFormForEdit(ev)} className="text-[12px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors px-2 py-1">
                              Modifier
                            </button>
                            <button type="button" onClick={() => handleDelete(ev.id)} aria-label="Supprimer" className="text-[#86868B] hover:text-[#FF3B30] transition-colors p-1.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : calendrier avec stick */}
        <div className="order-1 xl:order-2 xl:sticky xl:top-[120px]">
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple p-5 sm:p-6 mb-8 xl:mb-0">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#1D1D1F] flex items-center gap-2 capitalize">
                <CalendarIcon className="w-[18px] h-[18px] text-[#007AFF]" />
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex items-center gap-2 bg-[#F5F5F7] p-1 rounded-full">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-[#1D1D1F] transition-all shadow-sm shadow-transparent hover:shadow-black/5"
                  onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-[#1D1D1F] transition-all shadow-sm shadow-transparent hover:shadow-black/5"
                  onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d} className="font-bold text-[11px] uppercase tracking-widest text-[#86868B] py-2">
                  {d}
                </div>
              ))}
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[key] ?? [];
                const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isChosenForStructuredPost = showStructuredForm && editingId && formStart && formStart.startsWith(key);

                const uniqueTypes = Array.from(new Set(dayEvents.map(ev => ev.type)));

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day);
                      if (showForm && showStructuredForm) {
                        setFormStart(format(day, 'yyyy-MM-dd'));
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, key)}
                    className={cn(
                      'relative flex flex-col items-center justify-center aspect-square rounded-full text-[14px] font-medium transition-all duration-200 outline-none select-none',
                      isSameMonth(day, currentMonth) ? 'text-[#1D1D1F] hover:bg-[#F5F5F7]' : 'text-black/20',
                      isPast && !isSelected && 'opacity-60',
                      isSelected && 'bg-[#1D1D1F] text-white hover:bg-[#1D1D1F] font-bold shadow-lg',
                      isChosenForStructuredPost && 'ring-2 ring-offset-2 ring-[#007AFF] bg-white text-[#1D1D1F]'
                    )}
                  >
                    {format(day, 'd')}
                    {uniqueTypes.length > 0 && (
                      <div className="absolute bottom-1.5 flex items-center justify-center gap-0.5">
                        {uniqueTypes.slice(0, 3).map(type => (
                          <span
                            key={type}
                            className={cn(
                              "w-[5px] h-[5px] rounded-full transition-colors duration-200",
                              isSelected ? "bg-white" : EVENT_TYPE_COLORS[type].dot
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
