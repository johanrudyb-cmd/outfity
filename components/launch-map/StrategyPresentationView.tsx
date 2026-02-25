'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  RefreshCw,
  ArrowRight,
  Compass,
  Target,
  Radio,
  MessageCircle,
  Euro,
  Calendar,
  Globe,
  Store,
  Hash,
  MapPin,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
} from 'recharts';
import { getBrandLogoUrl } from '@/lib/curated-brands';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { cn } from '@/lib/utils';

/** Logo Shopify (S dans un cercle) pour le bouton d’affiliation */
function ShopifyLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.337 3.415c-.661-.384-1.533-.576-2.515-.576-1.378 0-2.423.288-3.133.864-.71.576-1.066 1.344-1.066 2.304 0 .672.192 1.248.576 1.728.384.48.864.768 1.44.864.192.048.384.048.576.048.192 0 .384-.048.576-.144.192-.096.384-.192.576-.336.192-.144.384-.336.576-.576.192-.24.384-.528.576-.864.288-.576.576-1.2.864-1.872.288-.672.576-1.344.864-2.016.288-.672.576-1.296.864-1.872.288-.576.576-1.056.864-1.44.288-.384.576-.672.864-.864.288-.192.576-.336.864-.432.288-.096.576-.144.864-.144.192 0 .384.048.576.144.192.096.384.24.576.432.192.192.384.432.576.72.192.288.384.624.576 1.008.288.672.576 1.392.864 2.16.288.768.576 1.536.864 2.304.288.768.576 1.488.864 2.16.288.672.576 1.248.864 1.728.288.48.576.864.864 1.152.288.288.576.48.864.576.288.096.576.144.864.144.192 0 .384-.048.576-.144.192-.096.384-.24.576-.432.192-.192.384-.432.576-.72.192-.288.384-.624.576-1.008.288-.672.576-1.392.864-2.16.288-.768.576-1.536.864-2.304.288-.768.576-1.488.864-2.16.288-.672.576-1.248.864-1.728.288-.48.576-.864.864-1.152.288-.288.576-.48.864-.576.288-.096.576-.144.864-.144.192 0 .384.048.576.144.192.096.384.24.576.432.192.192.384.432.576.72.192.288.384.624.576 1.008.288.672.576 1.392.864 2.16.288.768.576 1.536.864 2.304.288.768.576 1.488.864 2.16.288.672.576 1.248.864 1.728.288.48.576.864.864 1.152.288.288.576.48.864.576.288.096.576.144.864.144.576 0 1.056-.24 1.44-.72.384-.48.576-1.152.576-2.016 0-.864-.192-1.824-.576-2.88-.384-1.056-.864-2.16-1.44-3.312-.576-1.152-1.248-2.304-1.92-3.456-.672-1.152-1.392-2.256-2.16-3.312-.768-1.056-1.536-2.016-2.304-2.88-.768-.864-1.488-1.584-2.16-2.16-.672-.576-1.248-.96-1.728-1.152z" />
    </svg>
  );
}

/** Design system — Apple Design Language : accent bleu Apple pour éléments cliquables */
const ACCENT = '#007AFF';

/** Remplace les sources marchés par libellés panels ; enlève les hashtags bruts #mot (conserve les hex #RRGGBB). */
function sanitizeDisplayText(text: string): string {
  return text
    .replace(/\bASOS\b/gi, 'Panel Marché ALPHA (Gen-Z)')
    .replace(/\bZalando\b/gi, 'Panel Marché BETA (Premium)')
    .replace(/#([A-Za-zÀ-ÿ\u00C0-\u024F][A-Za-z0-9À-ÿ_\u00C0-\u024F]*)/g, '$1');
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
}

function parseSections(analysis: string): { title: string; content: string }[] {
  const cleaned = stripMarkdownBold(analysis);
  const blocks = cleaned.split(/\n(?=## )/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.trim().split('\n');
    const title = lines[0]?.replace(/^##\s*/, '').trim() ?? '';
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  });
}

const SECTION_ICONS: { label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Vision et positionnement', Icon: Compass },
  { label: 'Cible et client idéal', Icon: Target },
  { label: 'Offre et pricing', Icon: Euro },
  { label: 'Canaux et marketing', Icon: Radio },
  { label: 'Messages', Icon: MessageCircle },
  { label: 'Stratégie de contenu', Icon: FileText },
  { label: 'Site internet', Icon: Store },
];

function getSectionMeta(title: string, index: number): { label: string; Icon: React.ComponentType<{ className?: string }> } {
  const def = SECTION_ICONS[Math.min(index, SECTION_ICONS.length - 1)];
  const shortTitle = title.replace(/^\d+\.\s*/, '').trim();
  return { label: shortTitle.length <= 25 ? shortTitle : def.label, Icon: def.Icon };
}

function extractBullets(content: string, max = 3): string[] {
  return content
    .split('\n')
    .filter((l) => /^[-*]\s+/.test(l.trim()))
    .map((l) => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Extrait la première phrase ou un résumé court (vision / positionnement). */
function extractKeyPhrase(content: string, maxLen = 120): string {
  const first = content.split(/\n\n+/)[0]?.trim() ?? '';
  const sentence = first.split(/(?<=[.!?])\s+/)[0]?.trim() ?? first;
  return sentence.length > maxLen ? sentence.slice(0, maxLen - 1) + '…' : sentence;
}

/** Extrait des traits / puces pour la cible (profil, où les trouver). */
function extractCibleTraits(content: string): { profil: string[]; canaux: string[] } {
  const bullets = extractBullets(content, 8);
  const lower = content.toLowerCase();
  const canalKeywords = ['instagram', 'tiktok', 'twitter', 'facebook', 'linkedin', 'retail', 'influence', 'site web', 'e-commerce', 'réseaux', 'communautés', 'magasin', 'partenaires'];
  const canaux: string[] = [];
  canalKeywords.forEach((k) => {
    if (lower.includes(k)) canaux.push(k.charAt(0).toUpperCase() + k.slice(1));
  });
  return { profil: bullets.length ? bullets : [content.slice(0, 150).trim() + (content.length > 150 ? '…' : '')], canaux: [...new Set(canaux)].slice(0, 6) };
}

/** Palette couleurs Target Map : une couleur par canal (cœur + canaux) — Apple Design. */
const TARGET_MAP_COLORS = [
  '#007AFF', // Bleu Apple — cœur
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
];

/** Extrait fourchettes de prix ou niveaux (offre / pricing). */
function extractPricingFromContent(content: string): { label: string; value: number }[] {
  const lower = content.toLowerCase();
  const prices: number[] = [];
  const matches = content.match(/\d+\s*€|\d+\s*euros?|(\d+)\s*-\s*(\d+)\s*€/gi) ?? [];
  matches.forEach((m) => {
    const num = parseInt(m.replace(/[^\d]/g, '').slice(0, 4), 10);
    if (num > 0 && num < 100000) prices.push(num);
  });
  if (prices.length >= 2) {
    const sorted = [...new Set(prices)].sort((a, b) => a - b);
    const tiers = [
      { label: 'Entrée de gamme', value: sorted[0] },
      { label: 'Milieu de gamme', value: sorted[Math.floor(sorted.length / 2)] ?? sorted[0] },
      { label: 'Premium', value: sorted[sorted.length - 1] },
    ];
    return tiers;
  }
  if (lower.includes('entrée') || lower.includes('premium') || lower.includes('milieu')) {
    return [
      { label: 'Entrée', value: 50 },
      { label: 'Milieu', value: 120 },
      { label: 'Premium', value: 250 },
    ];
  }
  return [];
}

/** Extrait canaux mentionnés (pour schéma canaux). */
function extractChannelsFromContent(content: string): string[] {
  const lower = content.toLowerCase();
  const channels: string[] = [];
  const map: [string, string][] = [
    ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'],
    ['twitter', 'Twitter / X'],
    ['facebook', 'Facebook'],
    ['linkedin', 'LinkedIn'],
    ['youtube', 'YouTube'],
    ['retail', 'Retail'],
    ['e-commerce', 'E-commerce'],
    ['influence', 'Influence'],
    ['partenariats', 'Partenariats'],
    ['site web', 'Site web'],
    ['réseaux sociaux', 'Réseaux sociaux'],
  ];
  map.forEach(([key, label]) => {
    if (lower.includes(key)) channels.push(label);
  });
  return [...new Set(channels)].slice(0, 8);
}

/** Extrait hashtags ou thèmes (messages / storytelling). */
function extractMessageTags(content: string): string[] {
  const hashtags = content.match(/#[\wàâäéèêëïîôùûüç]+/gi) ?? [];
  const themes: string[] = hashtags.map((h) => h.slice(1));
  if (themes.length >= 2) return themes.slice(0, 10);
  const bullets = extractBullets(content, 6);
  if (bullets.length) return bullets.slice(0, 6);
  const first = content.split(/\n\n+/)[0]?.trim() ?? '';
  const firstSentence = first.split(/(?<=[.!?])\s+/)[0]?.trim() ?? first.slice(0, 400);
  return [firstSentence.slice(0, 500)];
}

/** Radar Vision : 5 axes (Technicité, Prix, Innovation, Durabilité, Volume). Valeurs 0–100 dérivées du contenu ou défaut. */
function getVisionRadarData(content: string): { subject: string; value: number; fullMark: number }[] {
  const lower = content.toLowerCase();
  const axes = [
    { subject: 'Technicité', key: 'technicité|technique|tech|performance', default: 65 },
    { subject: 'Prix', key: 'prix|premium|accessible|entrée', default: 55 },
    { subject: 'Innovation', key: 'innovation|nouveau|créatif', default: 70 },
    { subject: 'Durabilité', key: 'durabilité|eco|responsable|recycl', default: 50 },
    { subject: 'Volume', key: 'volume|mass|limited|exclusif', default: 45 },
  ];
  return axes.map(({ subject, key, default: d }) => {
    const regex = new RegExp(key, 'i');
    if (regex.test(lower)) return { subject, value: Math.min(100, d + 15), fullMark: 100 };
    return { subject, value: d, fullMark: 100 };
  });
}

export interface VisualIdentityData {
  colorPalette?: { primary?: string; secondary?: string; accent?: string };
  typography?: { heading?: string; body?: string };
  logoRecommendation?: string;
  /** Explication du choix du logo / identité (marques de référence). */
  logoRationale?: string;
}

interface StrategyPresentationViewProps {
  strategyText: string;
  brandName: string;
  positioning?: string;
  targetAudience?: string;
  templateBrandName?: string;
  /** true = preview marque de référence : on masque lancement, plan 0–12 mois, etc. */
  isTemplateView?: boolean;
  /** 'analysis' = libellés "Analyse" (analyse de marque) ; 'strategy' = "Stratégie" (stratégie calquée / ma marque) */
  titleMode?: 'strategy' | 'analysis';
  /** Identité visuelle (couleurs + polices) — recommandations modifiables au calquage */
  visualIdentity?: VisualIdentityData | null;
  /** true = stratégie verrouillée : identité visuelle (typo, couleurs) en lecture seule */
  visualIdentityLocked?: boolean;
  onClose?: () => void;
  /** Action principale optionnelle (ex. "Calquer la stratégie") affichée dans le header */
  optionalPrimaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  /** "Valider et continuer" dans la présentation (affiché quand stratégie calquée, pas en vue marque de référence) */
  optionalValidateAction?: { label: string; onClick: () => void; disabled?: boolean };
  /** Optionnel : régénérer la stratégie (bouton affiché uniquement pour "ma marque") */
  onRegenerate?: () => Promise<void>;
  /** true = intégré dans un onglet (pas de overlay plein écran, même disposition que les autres phases) */
  embedded?: boolean;
  /** URL du logo de la marque (prioritaire sur getBrandLogoUrl pour marques analysées non curatées) */
  logoUrl?: string | null;
  /** Date de la dernière mise à jour par IA */
  lastAIUpdate?: string | null;
  /** Si true, affiche un flou sur le contenu et un bouton d'upgrade */
  isFree?: boolean;
  isOpen?: boolean;
}

const DEFAULT_VISUAL_IDENTITY: VisualIdentityData = {
  colorPalette: { primary: '#1D1D1F', secondary: '#F5F5F7', accent: '#007AFF' },
  typography: { heading: 'Inter', body: 'Inter' },
};

export function StrategyPresentationView({
  strategyText,
  brandName,
  positioning = '',
  targetAudience = '',
  templateBrandName = '',
  isTemplateView = false,
  titleMode = 'strategy',
  visualIdentity: visualIdentityProp,
  visualIdentityLocked = false,
  onClose,
  optionalPrimaryAction,
  optionalValidateAction,
  onRegenerate,
  embedded = false,
  logoUrl: logoUrlProp,
  lastAIUpdate,
  isFree = false,
  isOpen = true,
}: StrategyPresentationViewProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen) return null;

  const initialVI = useMemo(
    () => ({
      colorPalette: {
        primary: visualIdentityProp?.colorPalette?.primary ?? DEFAULT_VISUAL_IDENTITY.colorPalette?.primary ?? '#1a1a1a',
        secondary: visualIdentityProp?.colorPalette?.secondary ?? DEFAULT_VISUAL_IDENTITY.colorPalette?.secondary ?? '#f5f5f5',
        accent: visualIdentityProp?.colorPalette?.accent ?? DEFAULT_VISUAL_IDENTITY.colorPalette?.accent ?? '#007AFF',
      },
      typography: {
        heading: visualIdentityProp?.typography?.heading ?? DEFAULT_VISUAL_IDENTITY.typography?.heading ?? 'Inter',
        body: visualIdentityProp?.typography?.body ?? DEFAULT_VISUAL_IDENTITY.typography?.body ?? 'Inter',
      },
    }),
    [visualIdentityProp]
  );
  const [primaryColor, setPrimaryColor] = useState(initialVI.colorPalette.primary);
  const [secondaryColor, setSecondaryColor] = useState(initialVI.colorPalette.secondary);
  const [accentColor, setAccentColor] = useState(initialVI.colorPalette.accent);
  const [headingFont, setHeadingFont] = useState(initialVI.typography.heading);
  const [bodyFont, setBodyFont] = useState(initialVI.typography.body);

  useEffect(() => {
    setPrimaryColor(initialVI.colorPalette.primary);
    setSecondaryColor(initialVI.colorPalette.secondary);
    setAccentColor(initialVI.colorPalette.accent);
    setHeadingFont(initialVI.typography.heading);
    setBodyFont(initialVI.typography.body);
  }, [initialVI.colorPalette.primary, initialVI.colorPalette.secondary, initialVI.colorPalette.accent, initialVI.typography.heading, initialVI.typography.body]);

  const sections = parseSections(strategyText);
  const sectionPreviewsRaw = sections.map((sec, idx) => {
    const firstLine = sec.content.split('\n').find((l) => l.trim().length > 0) ?? '';
    const firstSentence = firstLine.trim().split(/(?<=[.!?])\s+/)[0] ?? firstLine.trim();
    const preview = firstSentence || '—';
    const bullets = extractBullets(sec.content, 5);
    const def = SECTION_ICONS[Math.min(idx, SECTION_ICONS.length - 1)];
    const meta = { label: def.label, Icon: def.Icon };
    const isTimingSection = /plan|action|mois|timing/i.test(sec.title);
    return { ...sec, preview, bullets, meta, isTimingSection };
  });
  // Fil d'Ariane : uniquement les 7 points de la stratégie (éviter doublons "Site internet").
  // Exclure aussi "Analyse stratégique complète : marque" si présent en première section.
  const sectionPreviewsFiltered = sectionPreviewsRaw.filter(
    (sec) =>
      !/plan|action|mois|timing|lancement/i.test(sec.title) &&
      !/^analyse\s*stratégique\s*complète\s*:?\s*/i.test(sec.title.trim())
  );
  const sectionPreviews = sectionPreviewsFiltered.slice(0, 7).map((sec, i) => ({
    ...sec,
    meta: { label: SECTION_ICONS[i].label, Icon: SECTION_ICONS[i].Icon },
  }));

  function renderContent(text: string) {
    const sanitized = sanitizeDisplayText(text);
    return sanitized.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const bullet = line.replace(/^[-*] /, '').trim();
        return (
          <div key={i} className="flex gap-2 my-1.5 pl-3 border-l border-[#007AFF]/40">
            <span className="text-[#007AFF] shrink-0 text-xs">•</span>
            <span className="text-xs text-[#1D1D1F] leading-relaxed">{bullet}</span>
          </div>
        );
      }
      if (trimmed) {
        return (
          <p key={i} className="my-3 text-sm leading-relaxed text-[#1D1D1F]/60">
            {trimmed}
          </p>
        );
      }
      return null;
    });
  }

  /** Représentation schématique ou graphique pour chaque section (pour lire et comprendre la stratégie). */
  function renderSectionSchematic(sec: { title: string; content: string }, index: number) {
    const isVision = /vision|positionnement/i.test(sec.title);
    const isCible = /cible|client|idéal/i.test(sec.title);
    const isOffre = /offre|pricing|prix|gamme/i.test(sec.title);
    const isCanaux = /canaux|marketing|réseaux/i.test(sec.title);
    const isMessages = /messages|storytelling|thèmes|ton/i.test(sec.title);
    const isPlan = /plan|action|mois|timing/i.test(sec.title);

    if (isVision) {
      const radarData = getVisionRadarData(sec.content);
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Radar — Vision</p>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" strokeWidth={1} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Radar name="Vision" dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.35} strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (isCible) {
      const { profil, canaux } = extractCibleTraits(sec.content);
      const coreLabel = profil[0] ?? 'Cœur de cible';
      const canalLabels = canaux.length > 0 ? canaux.slice(0, 6) : ['Réseaux sociaux', 'Site web', 'Retail'];
      const labels = [coreLabel, ...canalLabels];
      const shares = labels.length === 1
        ? [100]
        : labels.length === 2
          ? [60, 40]
          : labels.length === 3
            ? [50, 30, 20]
            : labels.length === 4
              ? [40, 28, 20, 12]
              : labels.length === 5
                ? [35, 25, 18, 12, 10]
                : [30, 22, 16, 12, 10, 10];
      const donutData = labels.map((name, i) => ({
        name: typeof name === 'string' ? name : String(name),
        value: shares[i] ?? 10,
        fullName: typeof name === 'string' ? name : String(name),
        color: TARGET_MAP_COLORS[i % TARGET_MAP_COLORS.length],
      }));
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Cible — Répartition par canal</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height={260} className="sm:max-w-[280px] shrink-0">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={1}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  label={false}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
                  formatter={(value: number | undefined) => [`${value ?? 0} %`, 'Part']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? _}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase mb-2">Sources / Canaux</p>
              <ul className="space-y-1.5">
                {donutData.map((entry, j) => (
                  <li key={j} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-border"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden
                      />
                      <span className="text-[11px] text-foreground break-words line-clamp-2" title={entry.fullName}>
                        {entry.name}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground shrink-0">{entry.value} %</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (isOffre) {
      const pricing = extractPricingFromContent(sec.content);
      const tiers = pricing.length >= 2
        ? [
          { label: 'Entry / Merch', value: pricing[0].value },
          { label: 'Core collection', value: pricing[1].value },
          { label: 'Statement / Limited', value: pricing[2]?.value ?? pricing[1].value * 1.8 },
        ]
        : [
          { label: 'Entry / Merch', value: 50 },
          { label: 'Core collection', value: 120 },
          { label: 'Statement / Limited', value: 250 },
        ];
      const maxVal = Math.max(...tiers.map((t) => t.value), 1);
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Gamme de prix — Diagramme</p>
          <div className="flex-1 min-h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tiers} layout="vertical" margin={{ top: 4, right: 24, left: 90, bottom: 4 }}>
                <XAxis type="number" domain={[0, Math.ceil(maxVal * 1.15)]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v} €`} />
                <YAxis type="category" dataKey="label" width={85} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
                  formatter={(value: number | undefined) => [`${value ?? 0} €`, 'Prix']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                  {tiers.map((_, j) => (
                    <Cell key={j} fill={j === 0 ? ACCENT : j === 1 ? `${ACCENT}CC` : `${ACCENT}99`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (isCanaux) {
      const channels = extractChannelsFromContent(sec.content);
      if (channels.length === 0) channels.push('Réseaux sociaux', 'Site web', 'Partenariats');
      const withImportance = channels.map((c, j) => ({
        name: c,
        importance: j < 2 ? 'high' as const : j < 5 ? 'medium' as const : 'low' as const,
      }));
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Bento — Canaux</p>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 content-center items-center justify-items-center">
            {withImportance.map(({ name, importance }, j) => (
              <div
                key={j}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white shadow-apple relative w-full min-h-[100px] text-center"
              >
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: importance === 'high' ? ACCENT : importance === 'medium' ? '#1D1D1F/40' : '#1D1D1F/20',
                  }}
                  title={importance === 'high' ? 'Prioritaire' : importance === 'medium' ? 'Secondaire' : 'Optionnel'}
                />
                {/instagram|tiktok|réseaux/i.test(name) ? (
                  <Radio className="w-7 h-7 text-[#007AFF] shrink-0" />
                ) : /retail|magasin|e-commerce|site/i.test(name) ? (
                  <Store className="w-7 h-7 text-[#007AFF] shrink-0" />
                ) : (
                  <Globe className="w-7 h-7 text-[#007AFF] shrink-0" />
                )}
                <span className="text-xs font-medium leading-tight break-words w-full text-center text-[#1D1D1F]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isMessages) {
      const tags = extractMessageTags(sec.content);
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Thèmes & messages</p>
          <div className="flex-1 flex flex-wrap gap-3 content-start items-start min-h-[200px] overflow-y-auto">
            {tags.map((t, j) => (
              <span
                key={j}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/10 text-sm font-medium text-[#007AFF] break-words max-w-full whitespace-normal"
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="min-w-0 break-words">{t}</span>
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (isPlan) {
      const steps = extractBullets(sec.content, 8);
      return (
        <div className="rounded-3xl bg-white shadow-apple p-6 w-full h-full min-h-[260px] flex flex-col">
          <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Timeline — Jalons</p>
          <div className="flex-1 overflow-x-auto pb-2 -mx-1 min-h-[200px]">
            <div className="flex items-stretch gap-4 flex-wrap justify-center">
              {steps.map((step, j) => (
                <div key={j} className="flex items-start gap-3 min-w-[120px] max-w-[180px]">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center font-mono text-xs font-semibold text-white"
                    >
                      {j + 1}
                    </div>
                    {j < steps.length - 1 && (
                      <div className="w-px flex-1 min-h-[8px] bg-[#1D1D1F]/10" aria-hidden />
                    )}
                  </div>
                  <p className="text-sm text-[#1D1D1F] leading-snug text-left break-words pt-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  const scrollToSection = (index: number) => {
    document.getElementById(`strategy-section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const content = (
    <div className={cn(
      embedded ? 'w-full px-4 sm:px-8 py-0' : 'min-h-full px-4 sm:px-8 py-8 sm:py-12 bg-[#F5F5F7]',
      isFree && "relative overflow-hidden"
    )}>
      {isFree && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/20 backdrop-blur-md">
          <Card className="max-w-md w-full border-2 border-[#007AFF]/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center shadow-lg shadow-[#007AFF]/25">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Débloquez la Stratégie IA</h3>
                <p className="text-[#1D1D1F]/60 px-4">
                  Pour accéder à la stratégie marketing complète adaptée à votre marque par l&apos;IA, passez au plan Pro.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3 px-4">
                <Button
                  onClick={() => router.push('/auth/choose-plan')}
                  className="w-full h-14 rounded-2xl bg-[#007AFF] hover:bg-[#0056CC] text-white font-semibold text-lg shadow-apple tracking-tight"
                >
                  Passer au plan Pro
                </Button>
                <p className="text-xs text-[#1D1D1F]/40 font-medium">
                  Contenu stratégique haute précision généré par GPT-4
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className={cn("transition-all duration-500", isFree && "blur-[8px] select-none pointer-events-none opacity-40")}>
        {/* Header sticky : masqué en mode embedded (le titre est déjà dans l'onglet) */}
        {!embedded && (
          <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-12 -mt-8 sm:-mt-12 lg:-mt-16 px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12 lg:pt-16 pb-6 mb-8 backdrop-blur-xl bg-white/80 border-b border-black/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="min-w-0 w-full">
                <h1 className="text-2xl sm:text-3xl xl:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-2 break-words">
                  {titleMode === 'analysis'
                    ? `Analyse · ${brandName || 'Marque de référence'}`
                    : isTemplateView
                      ? `Stratégie · ${brandName || 'Marque de référence'}`
                      : `Stratégie · ${brandName || 'Ma marque'}`}
                </h1>
                <p className="text-sm sm:text-base text-[#1D1D1F]/60 truncate">
                  {titleMode === 'analysis'
                    ? 'Présentation de la stratégie de la marque (analyse)'
                    : isTemplateView
                      ? 'Aperçu de la stratégie de la marque de référence'
                      : templateBrandName
                        ? `Inspiré de ${templateBrandName}`
                        : 'Présentation de votre stratégie'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.refresh()}
                  className="gap-1.5 h-10 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm text-[#1D1D1F]/60 hover:text-[#007AFF] shrink-0"
                  aria-label="Actualiser l'affichage"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                {onRegenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={regenerating}
                    onClick={async () => {
                      setRegenerating(true);
                      try {
                        await onRegenerate();
                      } finally {
                        setRegenerating(false);
                      }
                    }}
                    className="gap-1.5 h-10 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm shrink-0"
                  >
                    {regenerating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Régénérer</span>
                  </Button>
                )}
                {optionalPrimaryAction && (
                  <Button
                    variant="secondary"
                    onClick={optionalPrimaryAction.onClick}
                    disabled={optionalPrimaryAction.disabled}
                    className="gap-2 h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base shrink-0"
                  >
                    {optionalPrimaryAction.label}
                  </Button>
                )}
                {optionalValidateAction && !isTemplateView && (
                  <Button
                    variant="default"
                    onClick={optionalValidateAction.onClick}
                    disabled={optionalValidateAction.disabled}
                    className="gap-2 h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 h-4" />
                    {optionalValidateAction.label}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="shrink-0 gap-2 h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base text-[#1D1D1F]/60 hover:text-[#007AFF]"
                  aria-label="Fermer la présentation"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden sm:inline">Fermer</span>
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Premium Navigation Dock - Floating Island Style */}
        <div className="flex justify-center mb-16 sticky top-8 z-30">
          <nav className="bg-white/70 backdrop-blur-3xl rounded-full border border-black/[0.03] shadow-apple-lg px-3 py-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full" aria-label="Sections de la stratégie">
            {sectionPreviews.map((sec, i) => (
              <div key={i} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => scrollToSection(i)}
                  className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-black/[0.02] transition-all group whitespace-nowrap"
                  aria-label={`Aller à la section ${sec.meta.label}`}
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center text-[#007AFF] group-hover:bg-[#007AFF] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-500/20">
                    <sec.meta.Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1D1D1F]/40 group-hover:text-[#007AFF] transition-colors">
                    {sec.meta.label}
                  </span>
                </button>
                {i < sectionPreviews.length - 1 && (
                  <div className="w-px h-6 bg-black/[0.06] mx-1 shrink-0 hidden lg:block" aria-hidden />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-3 mb-12">
          {isTemplateView ? (
            brandName && (
              <span className="px-5 py-2.5 rounded-full bg-[#007AFF]/10 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#007AFF] border border-[#007AFF]/20">
                Inspiration : {brandName}
              </span>
            )
          ) : (
            <>
              {brandName && (
                <span className="px-5 py-2.5 rounded-full bg-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#1D1D1F] border border-black/5 shadow-apple-sm">{brandName}</span>
              )}
              {positioning && (
                <span className="px-5 py-2.5 rounded-full bg-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-black/40 border border-black/5 shadow-apple-sm">{positioning}</span>
              )}
              {targetAudience && (
                <span className="px-5 py-2.5 rounded-full bg-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-black/40 border border-black/5 shadow-apple-sm">{targetAudience}</span>
              )}
              {lastAIUpdate && !isNaN(new Date(lastAIUpdate).getTime()) && (
                <span className="px-5 py-2.5 rounded-full bg-emerald-50 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 border border-emerald-100 italic">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Forgé par l&apos;IA • {new Date(lastAIUpdate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </span>
              )}
            </>
          )}
        </div>

        {/* Identité visuelle — logo (template) + explication + couleurs + polices */}
        {(visualIdentityProp?.colorPalette || visualIdentityProp?.typography || visualIdentityProp?.logoRecommendation || visualIdentityProp?.logoRationale || (isTemplateView && brandName)) && (
          <div className="mb-20 space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Direction Artistique</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">L&apos;ADN Visuel</h2>
            </div>
            <Card className="rounded-[40px] bg-white shadow-apple-lg border-black/[0.03] overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                {isTemplateView && brandName && (
                  <div className="mb-6 flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-32 h-32 rounded-3xl bg-white shadow-apple overflow-hidden shrink-0 flex items-center justify-center p-4">
                      <BrandLogo logoUrl={logoUrlProp ?? getBrandLogoUrl(brandName)} brandName={brandName} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-2">Pourquoi cette identité</p>
                      <p className="text-base text-[#1D1D1F] leading-relaxed">
                        {visualIdentityProp?.logoRationale || visualIdentityProp?.logoRecommendation || 'Identité visuelle alignée avec le positionnement et la cible de la marque.'}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-[#1D1D1F]/60 mb-6">
                  {visualIdentityLocked
                    ? 'Couleurs et polices de votre stratégie (identité visuelle verrouillée).'
                    : isTemplateView
                      ? 'Couleurs et polices de la marque. Au calquage, l\'IA proposera une identité inspirée (même style, couleurs et polices différentes) et une recommandation pour votre logo.'
                      : 'Couleurs et polices inspirées de la marque de référence (même style, pas de copie). Vous pouvez les modifier et les appliquer à votre identité.'}
                </p>
                {(visualIdentityProp?.colorPalette || visualIdentityProp?.typography) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Palette couleurs</p>
                      <div className="space-y-3">
                        {[
                          { label: 'Primaire', value: primaryColor, set: setPrimaryColor },
                          { label: 'Secondaire', value: secondaryColor, set: setSecondaryColor },
                          { label: 'Accent', value: accentColor, set: setAccentColor },
                        ].map(({ label, value, set }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-3xl shadow-apple shrink-0"
                              style={{ backgroundColor: value }}
                              title={value}
                            />
                            {visualIdentityLocked ? (
                              <span className="font-mono text-sm text-[#1D1D1F]/60" aria-label={`Couleur ${label}`}>{value}</span>
                            ) : (
                              <Input
                                value={value}
                                onChange={(e) => set(e.target.value)}
                                className="font-mono text-sm h-11 max-w-[140px]"
                                placeholder="#000000"
                                aria-label={`Couleur ${label}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-4">Typographie</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-[#1D1D1F]/60 block mb-2">Titres</label>
                          {visualIdentityLocked ? (
                            <p className="text-base text-[#1D1D1F] py-2">{headingFont || '—'}</p>
                          ) : (
                            <Input
                              value={headingFont}
                              onChange={(e) => setHeadingFont(e.target.value)}
                              className="text-base h-11"
                              placeholder="Ex. Inter, Playfair Display"
                              aria-label="Police titres"
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-[#1D1D1F]/60 block mb-2">Corps</label>
                          {visualIdentityLocked ? (
                            <p className="text-base text-[#1D1D1F] py-2">{bodyFont || '—'}</p>
                          ) : (
                            <Input
                              value={bodyFont}
                              onChange={(e) => setBodyFont(e.target.value)}
                              className="text-base h-11"
                              placeholder="Ex. Inter, Open Sans"
                              aria-label="Police corps"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {visualIdentityProp?.logoRecommendation && (
                  <div className="rounded-3xl bg-white shadow-apple p-6">
                    <p className="text-xs font-semibold text-[#1D1D1F]/60 uppercase tracking-wider mb-3">Recommandation logo</p>
                    <p className="text-base text-[#1D1D1F] leading-relaxed">{visualIdentityProp.logoRecommendation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-12 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Exploration Profonde</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">Plan d&apos;Action Stratégique</h2>
        </div>

        <div className="space-y-16 lg:space-y-24 pb-32">
          {sectionPreviews.map((sec, i) => {
            const schematic = renderSectionSchematic(sec, i);
            return (
              <div key={i} id={`strategy-section-${i}`} className="space-y-8 scroll-mt-24 animate-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-white shadow-apple-sm border border-black/5 flex items-center justify-center shrink-0">
                    <sec.meta.Icon className="w-7 h-7 text-[#007AFF]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF]">Section 0{i + 1}</p>
                    <h3 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">{sec.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                  <div className="rounded-[40px] bg-white shadow-apple p-8 flex flex-col justify-center border border-black/[0.03]">
                    <div className="w-full min-w-0">
                      {schematic || (
                        <div className="w-full text-left space-y-4">
                          <p className="text-xl font-medium text-[#1D1D1F] leading-relaxed italic opacity-80">&quot;{sec.preview}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[40px] bg-white border border-black/[0.03] shadow-apple p-8 sm:p-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007AFF] mb-8">Détails de l&apos;Anatomie</p>
                    <div className="text-sm sm:text-base leading-relaxed space-y-4 text-[#1D1D1F]/70">
                      {sec.isTimingSection && sec.bullets.length > 0 ? (
                        <>
                          <ol className="relative border-l-2 border-[#007AFF]/20 pl-8 space-y-6">
                            {sec.bullets.map((step, j) => (
                              <li key={j} className="relative flex flex-col gap-1">
                                <span className="absolute -left-[45px] w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-blue-500/20">
                                  {j + 1}
                                </span>
                                <span className="text-lg font-bold text-[#1D1D1F]">{sanitizeDisplayText(step)}</span>
                              </li>
                            ))}
                          </ol>
                          {sec.content.replace(new RegExp('\n[-*]\\s+', 'g'), '\n').trim().length > sec.bullets.join(' ').length && (
                            <div className="mt-8 pt-8 border-t border-black/5 leading-loose">{renderContent(sec.content)}</div>
                          )}
                        </>
                      ) : (
                        <div className="leading-loose font-medium">{renderContent(sec.content)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#F5F5F7]" role="dialog" aria-modal="true">
      {content}
    </div>
  );
}
