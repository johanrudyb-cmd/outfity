'use client';

import { useState, useMemo } from 'react';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { useQuota } from '@/lib/hooks/useQuota';
import { useSession } from 'next-auth/react';
import useSWR, { useSWRConfig } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, UserPlus, Upload, Download, Image as ImageIcon, Shirt, Info, CheckCircle2, X, ZoomIn, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureUsageBadge } from '@/components/usage/FeatureUsageBadge';
import { QuotaGenerateButton } from '@/components/usage/QuotaGenerateButton';
import { isFreePlan } from '@/lib/plan-utils';

/** Design enregistré dans la collection (même source que mockup/tech pack). */
export interface ShootingDesign {
  id: string;
  type: string;
  templateName?: string | null;
  flatSketchUrl: string | null;
  productImageUrl?: string | null;
}

interface Mannequin {
  id: string;
  name: string;
  imageUrl: string;
  source: string;
  gender?: 'male' | 'female' | 'unisex';
  description?: string;
}

interface ShootingPhotoProps {
  brandId: string;
  /** Designs passés en initial (optionnel). Si absent, chargement via API. */
  designs?: ShootingDesign[];
  onSwitchToTryOn?: () => void;
  onSelectImage?: (url: string) => void;
}

const GARMENT_TYPES = ['T-shirt', 'Hoodie', 'Sweatshirt', 'Pantalon', 'Short', 'Veste'] as const;

/** Options type studio photo : chaque choix rend la photo unique. */
const LOCATION_OPTIONS = [
  { id: 'studio', label: 'Studio', promptValue: 'indoor photo studio' },
  { id: 'outdoor', label: 'Extérieur', promptValue: 'outdoor location' },
  { id: 'boat_deck', label: 'Bateau / Yacht', promptValue: 'onboard a luxury boat deck, cushioned seating' },
] as const;

const OUTDOOR_OPTIONS = [
  { id: 'urban', label: 'Urbain (rue, ville)', promptValue: 'urban street, city background' },
  { id: 'nature', label: 'Nature (parc, forêt)', promptValue: 'nature, park or forest' },
  { id: 'beach', label: 'Plage', promptValue: 'beach, seaside' },
  { id: 'terrace', label: 'Terrasse / café', promptValue: 'terrace, café, casual outdoor' },
  { id: 'minimal_outdoor', label: 'Extérieur minimal (mur, quai)', promptValue: 'minimal outdoor, wall or quay' },
  { id: 'gas_station_night', label: 'UK Gas Station (Nuit)', promptValue: 'gas station in England at night, wet ground reflecting colorful urban lights, building with signs' },
  { id: 'soft_corner_rug', label: 'Coin Soft + Tapis', promptValue: 'minimalist indoor corner space with pale grey fabric walls and white fluffy rug' },
  { id: 'mediterranean_coast', label: 'Côte Méditerranéenne', promptValue: 'scenic coastal town and terraced green hills in background, calm sea with anchored yachts' },
] as const;

const LIGHTING_OPTIONS = [
  { id: 'soft_natural', label: 'Naturel doux', promptValue: 'soft natural lighting' },
  { id: 'studio_softbox', label: 'Studio (softbox)', promptValue: 'studio softbox lighting, professional' },
  { id: 'soft_studio_diffused', label: 'Studio Diffus (Luxe)', promptValue: 'large soft key light, gentle fill, soft overhead diffusion, natural shadow density, no harsh hotspots' },
  { id: 'dramatic', label: 'Dramatique (contrasté)', promptValue: 'dramatic lighting, high contrast' },
  { id: 'golden_hour', label: 'Golden hour', promptValue: 'golden hour, warm sunlight' },
  { id: 'neon', label: 'Néon / urbain', promptValue: 'neon or urban night lighting' },
  { id: 'flat', label: 'Plat (e-commerce)', promptValue: 'flat even lighting, e-commerce' },
  { id: 'night_cinematic', label: 'Nuit Cinématique', promptValue: 'cinematic night lighting, vibrant reflections from artificial lights, HDR sharpness' },
  { id: 'youtube_studio', label: 'YouTube Studio (Vlog)', promptValue: 'cinematic YouTube lighting, soft key light with subtle rim light, professional studio look' },
  { id: 'retro_flash', label: 'Flash Direct Retro', promptValue: 'built-in flash pop direct on skin, flattering glow and specular highlights, high-end 90s party vibe' },
] as const;

const BACKGROUND_OPTIONS = [
  { id: 'crimson_studio', label: 'Crimson Studio (Valentine)', promptValue: 'fully monochrome deep crimson studio, seamless red backdrop, glossy reflective red floor' },
  { id: 'blush_pink_infinity', label: 'Rose Poudré (Infini)', promptValue: 'spacious studio environment with distant seamless soft blush-pink infinity backdrop, soft luxury pink tone, no horizon line, no corners' },
  { id: 'neutral_grey', label: 'Neutre gris', promptValue: 'neutral grey background' },
  { id: 'white', label: 'Blanc', promptValue: 'white background' },
  { id: 'black', label: 'Noir', promptValue: 'black background' },
  { id: 'pastel', label: 'Pastel (dégradé)', promptValue: 'pastel or soft gradient background' },
  { id: 'vivid', label: 'Coloré vif', promptValue: 'vivid colored background' },
  { id: 'blur', label: 'Flou (bokeh)', promptValue: 'blurred background, bokeh' },
  { id: 'minimal', label: 'Décor minimal', promptValue: 'minimal decor, clean' },
] as const;

const FRAMING_OPTIONS = [
  { id: 'portrait', label: 'Portrait (buste)', promptValue: 'portrait, bust shot' },
  { id: 'mid_body', label: 'Mi-corps', promptValue: 'mid-body, waist up' },
  { id: 'full_body', label: 'Full body', promptValue: 'full body shot' },
  { id: 'editorial', label: 'Editorial (démarche)', promptValue: 'editorial, walking pose' },
  { id: 'static', label: 'Statique (debout)', promptValue: 'standing static pose' },
  { id: 'footwear_ground_pose', label: 'Focus Chaussures (Sol)', promptValue: 'shoes resting naturally on floor, one upright, one leaning, no motion, footwear is hero subject, no face visible' },
] as const;

const MOOD_OPTIONS = [
  { id: 'ecommerce', label: 'E-commerce (produit)', promptValue: 'e-commerce product style' },
  { id: 'lookbook', label: 'Lookbook', promptValue: 'fashion lookbook style' },
  { id: 'streetwear', label: 'Streetwear', promptValue: 'streetwear, urban style' },
  { id: 'luxury', label: 'Luxe', promptValue: 'luxury fashion, high end' },
  { id: 'casual', label: 'Décontracté', promptValue: 'casual, relaxed style' },
  { id: 'vibe_influencer', label: 'Vibe Influence', promptValue: 'influencer lifestyle style, carefree, confident, professional aesthetic' },
  { id: 'valentine_editorial', label: 'Valentine Editorial', promptValue: 'High-fashion Valentine’s editorial, dramatic single key spotlight, sculpted shadows, rim light, dominant energy' },
  { id: 'uk_drill_street', label: 'UK Street / Drill', promptValue: 'dark and moody UK street aesthetic, ultra-realistic portrait, natural proportions, authentic vibe' },
  { id: 'cozy_editorial', label: 'Cozy Editorial', promptValue: 'clean minimalistic fashion editorial, modern and cozy vibe, cream whites and pale greys, soft textures' },
  { id: 'luxury_footwear', label: 'Luxury Footwear (Maroon)', promptValue: 'luxury high-fashion footwear editorial, model wearing maroon elegant jumpsuit (slender Indian model, fair skin, face not visible), rose pearl nails, footwear craftsmanship focus' },
  { id: 'male_creator', label: 'Male Creator / Vlog', promptValue: 'lifestyle YouTube creator aesthetic, friendly and approachable vibe, vlogger identity, premium influencer branding' },
  { id: 'vintage_90s', label: 'Vintage 90s Retro', promptValue: 'ultra realistic vintage portrait, 90s style photo, dreamy haze glow around subject, low contrast natural grading SOOC, creamy colors' },
  { id: 'vacation_luxury', label: 'Luxe Vacances', promptValue: 'vacation luxury vibe with Mediterranean coastal atmosphere, aspirational lifestyle mood, sun-kissed' },
] as const;

const HAIR_OPTIONS = [
  { id: 'natural', label: 'Naturel', promptValue: 'natural hair, soft movement', genderRelevance: 'unisex' },
  { id: 'holiday_finish', label: 'Effet vacances', promptValue: 'relaxed holiday finish hair, neatly behind shoulders', genderRelevance: 'female' },
  { id: 'sleek', label: 'Lisse / élégant', promptValue: 'sleek elegant hair style', genderRelevance: 'unisex' },
  { id: 'sleek_pony', label: 'Queue de cheval lisse', promptValue: 'sleek high ponytail with glass-like shine', genderRelevance: 'female' },
  { id: 'messy_bun', label: 'Chignon flou', promptValue: 'messy hair bun, casual style', genderRelevance: 'female' },
  { id: 'wavy_textured', label: 'Ondulé / Texturé', promptValue: 'wavy hair with texture, slightly messy', genderRelevance: 'unisex' },
  { id: 'straight_bangs', label: 'Lisse à frange', promptValue: 'straight long hair with blunt bangs', genderRelevance: 'female' },
  { id: 'volume_up', label: 'Volume Haut / Coiffé', promptValue: 'short dark brown hair styled upward with volume, thick defined eyebrows', genderRelevance: 'male' },
  { id: 'groomed', label: 'Soigné', promptValue: 'neatly groomed hair', genderRelevance: 'male' },
] as const;

const MAKEUP_OPTIONS = [
  { id: 'none', label: 'Aucun / Naturel', promptValue: 'no makeup, natural skin', genderRelevance: 'unisex' },
  { id: 'vacation_glam', label: 'Vacation Glam', promptValue: 'fresh vacation glam makeup, glowing skin with visible texture, sun-kissed warmth, radiant', genderRelevance: 'female' },
  { id: 'natural_glow', label: 'Glow naturel', promptValue: 'natural glow makeup, dewy skin', genderRelevance: 'female' },
  { id: 'clean_girl', label: 'Clean Girl', promptValue: 'clean girl aesthetic makeup, minimalist', genderRelevance: 'female' },
  { id: 'bold_red_lip', label: 'Rouge audacieux', promptValue: 'matte flawless skin, sharp winged liner, bold blue-toned red lipstick, subtle contour', genderRelevance: 'female' },
  { id: 'soft_glam', label: 'Soft Glam', promptValue: 'soft glam makeup, natural lips with subtle gloss, glowing skin, warm highlights', genderRelevance: 'female' },
  { id: 'grooming_basic', label: 'Grooming (discret)', promptValue: 'natural clean skin grooming', genderRelevance: 'male' },
] as const;

const ACCESSORIES_OPTIONS = [
  { id: 'luxe_bags', label: 'Sacs de luxe', promptValue: 'carrying a luxury designer mini bag' },
  { id: 'gold_jewelry', label: 'Bijoux dorés', promptValue: 'gold hoop earrings, layered delicate gold bracelets and rings' },
  { id: 'chic_sunglasses', label: 'Lunettes chic', promptValue: 'chic designer sunglasses' },
] as const;

const PROPS_OPTIONS = [
  { id: 'ice_cream', label: 'Glace', promptValue: 'holding a pink ice cream scoop in a cone near lips' },
  { id: 'coffee', label: 'Café / Latte', promptValue: 'holding a takeaway coffee cup' },
  { id: 'phone', label: 'Smartphone', promptValue: 'holding a modern smartphone, casual use' },
  { id: 'silk_rose', label: 'Rose (Fleur)', promptValue: 'holding a single red rose, elegant' },
  { id: 'scattered_roses', label: 'Roses au sol', promptValue: 'oversized silk roses scattered across the floor' },
  { id: 'golf_r', label: 'Golf R (Noire)', promptValue: 'leaning against a black VW Golf R, street context' },
  { id: 'beer_bottle', label: 'Bière / Boisson', promptValue: 'holding a cold beer bottle, sipping' },
] as const;

const CAMERA_FINISH_OPTIONS = [
  { id: 'instagram_pro', label: 'Instagram Pro', promptValue: 'high-end Instagram travel aesthetic, natural light photography, shallow depth of field, realistic skin texture' },
  { id: 'editorial_grain', label: 'Grain Editorial', promptValue: 'editorial photography, subtle film grain, crisp focus' },
  { id: 'bokeh_luxury', label: 'Bokeh Luxe', promptValue: 'luxury bokeh, dreamy background blur' },
  { id: 'vogue_campaign', label: 'Campagne Vogue', promptValue: 'Vogue-style luxury campaign, cinematic color grading, sharp editorial lighting, high detail, premium fashion advertisement, 85mm lens' },
  { id: 'iphone_16_pro', label: 'iPhone 17 Pro Max', promptValue: 'iPhone 17 Pro Max photo quality, 8k, ultra-realistic detailed hyper, HDR cinematic sharpness, natural proportions' },
  { id: 'smartphone_wide', label: 'Smartphone Grand Angle', promptValue: 'smartphone camera, wide-angle fixed lens, slight distortion, deep focus, no film grain' },
  { id: 'cinematic_product_4k', label: 'Cinematic 4K (Produit)', promptValue: '4K vertical 9:16 cinematic studio setup, camera locked, no zoom, shallow depth of field, luxury editorial realism, no glow effects' },
  { id: 'dslr_pro_vlog', label: 'DSLR Pro Vlog', promptValue: 'DSLR quality, 8K resolution, hyper-realistic details, natural skin imperfections, high dynamic range, modern content creator style' },
  { id: 'vintage_powershot', label: 'Canon PowerShot G7X', promptValue: 'Photorealistic Canon PowerShot G7X Mark III signature look, creamy bokeh, f/1.8-2.8, fine film grain, vintage mood glowy effect, SOOC natural colors' },
] as const;

/** Angles pour shooting produit (4 photos obligatoires). */
const PRODUCT_ANGLE_LABELS = ['Face', 'Dos', 'Profil gauche', 'Profil droit'] as const;

/** Options facultatives pour 1 mannequin (pose / action). */
const MANNEQUIN_POSE_OPTIONS = [
  { id: 'portrait_camera', label: 'Portrait regard caméra', promptValue: 'looking at camera, portrait pose' },
  { id: 'walking', label: 'Marche dynamique', promptValue: 'walking dynamically, editorial walk' },
  { id: 'sitting', label: 'Assis', promptValue: 'sitting pose' },
  { id: 'hand_hip', label: 'Main sur hanche', promptValue: 'hand on hip, confident pose' },
  { id: 'back_turn', label: 'Dos à la caméra', promptValue: 'back to camera, turning away' },
  { id: 'profile', label: 'De profil', promptValue: 'profile view, side pose' },
  { id: 'crossed_arms', label: 'Bras croisés', promptValue: 'arms crossed, relaxed' },
  { id: 'natural_stand', label: 'Debout naturel', promptValue: 'natural standing, casual' },
  { id: 'floor_leg_up', label: 'Au sol jambe levée', promptValue: 'lying on floor, supporting upper body, one leg raised against wall, looking into phone camera' },
  { id: 'sexy_confident', label: 'Sexy / Confiante', promptValue: 'sexy confident pose, looking over shoulder, hair slightly messy, natural allure' },
  { id: 'boat_lounging', label: 'Détente Bateau', promptValue: 'reclining on cushioned boat seat, arm casually stretched over seat, lounging posture' },
] as const;

/** Options facultatives pour 2 ou 3 mannequins (groupe). */
const MANNEQUIN_GROUP_POSE_OPTIONS = [
  { id: 'group_side_by_side', label: 'Côte à côte', promptValue: 'two or three models side by side, group pose' },
  { id: 'group_one_behind', label: 'Un devant, l’autre(s) derrière', promptValue: 'one model in front, others behind, depth' },
  { id: 'group_walking', label: 'Marche en groupe', promptValue: 'group walking together, editorial walk' },
  { id: 'group_interaction', label: 'Interaction / discussion', promptValue: 'models interacting, casual conversation pose' },
  { id: 'group_mirror', label: 'Poses miroir (symétriques)', promptValue: 'mirror poses, symmetrical composition' },
  { id: 'group_staggered', label: 'Décalés (premier plan / arrière)', promptValue: 'staggered positions, foreground and background' },
  { id: 'group_lookbook', label: 'Lookbook groupe', promptValue: 'fashion lookbook group shot, cohesive' },
  { id: 'group_casual', label: 'Décontracté groupe', promptValue: 'casual group pose, relaxed' },
] as const;

/** Formats / ratios d'aspect pour shooting mannequin. */
const ASPECT_RATIO_OPTIONS = [
  { id: '3:4', label: '3:4 (portrait)', value: '3:4' },
  { id: '1:1', label: '1:1 (carré)', value: '1:1' },
  { id: '4:5', label: '4:5 (portrait)', value: '4:5' },
  { id: '9:16', label: '9:16 (stories)', value: '9:16' },
  { id: '16:9', label: '16:9 (paysage)', value: '16:9' },
] as const;

/** Fond et éclairage pour shooting produit uniquement. */
const PRODUCT_BACKGROUND_OPTIONS = [
  { id: 'white', label: 'Blanc', promptValue: 'white background' },
  { id: 'grey', label: 'Neutre gris', promptValue: 'neutral grey background' },
  { id: 'black', label: 'Noir', promptValue: 'black background' },
  { id: 'minimal', label: 'Minimal (léger ombre)', promptValue: 'minimal shadow, clean' },
] as const;

/** Image à utiliser pour le shooting : photo produit (mockup) en priorité, comme pour le tech pack. */
function getDesignImageUrl(design: ShootingDesign): string | null {
  return design.productImageUrl || design.flatSketchUrl || null;
}

function getDesignDisplayName(design: ShootingDesign): string {
  return (design.templateName && design.templateName.trim()) || design.type;
}

function getOptionLabel<T extends readonly { id: string; label: string }[]>(opts: T, id: string): string {
  return opts.find((o) => o.id === id)?.label ?? id;
}

function getPoseOptionLabel(poseId: string): string {
  return getOptionLabel(MANNEQUIN_POSE_OPTIONS, poseId) || getOptionLabel(MANNEQUIN_GROUP_POSE_OPTIONS, poseId);
}

const QUALITY_BASE = 'high-end photography, cinematic lighting';

/** Construit le prompt scène (anglais) pour le moteur à partir des choix utilisateur. */
function buildScenePrompt(options: {
  location: string;
  outdoorType: string;
  lighting: string;
  background: string;
  framing: string;
  mood: string;
  hair: string;
  makeup: string;
  accessories: string[];
  props: string[];
  cameraFinish: string;
  mannequinInstruction?: string;
  mannequinPoseOptional?: string;
}): string {
  const parts: string[] = [QUALITY_BASE];
  const loc = LOCATION_OPTIONS.find((o) => o.id === options.location);
  if (loc) parts.push(loc.promptValue);
  if (options.location === 'outdoor') {
    const out = OUTDOOR_OPTIONS.find((o) => o.id === options.outdoorType);
    if (out) parts.push(out.promptValue);
  }
  const light = LIGHTING_OPTIONS.find((o) => o.id === options.lighting);
  if (light) parts.push(light.promptValue);
  const bg = BACKGROUND_OPTIONS.find((o) => o.id === options.background);
  if (bg) parts.push(bg.promptValue);
  const frame = FRAMING_OPTIONS.find((o) => o.id === options.framing);
  if (frame) parts.push(frame.promptValue);
  const moodOpt = MOOD_OPTIONS.find((o) => o.id === options.mood);
  if (moodOpt) parts.push(moodOpt.promptValue);

  const hairOpt = HAIR_OPTIONS.find((o) => o.id === options.hair);
  if (hairOpt) parts.push(hairOpt.promptValue);
  const makeupOpt = MAKEUP_OPTIONS.find((o) => o.id === options.makeup);
  if (makeupOpt) parts.push(makeupOpt.promptValue);

  options.accessories.forEach(accId => {
    const opt = ACCESSORIES_OPTIONS.find(o => o.id === accId);
    if (opt) parts.push(opt.promptValue);
  });

  options.props.forEach(propId => {
    const opt = PROPS_OPTIONS.find(o => o.id === propId);
    if (opt) parts.push(opt.promptValue);
  });

  const camOpt = CAMERA_FINISH_OPTIONS.find((o) => o.id === options.cameraFinish);
  if (camOpt) parts.push(camOpt.promptValue);

  if (options.mannequinPoseOptional) {
    const poseSingle = MANNEQUIN_POSE_OPTIONS.find((o) => o.id === options.mannequinPoseOptional);
    const poseGroup = MANNEQUIN_GROUP_POSE_OPTIONS.find((o) => o.id === options.mannequinPoseOptional);
    const pose = poseSingle ?? poseGroup;
    if (pose) parts.push(pose.promptValue);
  }
  if (options.mannequinInstruction?.trim()) {
    parts.push(options.mannequinInstruction.trim());
  }
  return parts.join(', ');
}

type ShootingMode = 'product' | 'mannequin';

export function ShootingPhoto({ brandId, designs: initialDesigns, onSwitchToTryOn, onSelectImage }: ShootingPhotoProps) {
  const photoQuota = useQuota('ugc_shooting_photo');
  const productQuota = useQuota('ugc_shooting_product');
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const isFree = isFreePlan((session?.user as any)?.plan);
  const [shootingMode, setShootingMode] = useState<ShootingMode>('mannequin');

  const { data: mannequinsData, isLoading: loadingMannequins } = useSWR<Mannequin[]>(
    brandId ? `/api/ugc/mannequins?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher
  );
  const mannequins = mannequinsData || [];

  const { data: designsData, isLoading: swrLoadingDesigns } = useSWR<{ designs: ShootingDesign[] }>(
    brandId ? `/api/designs?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher
  );

  const designs = initialDesigns?.length ? initialDesigns : (designsData?.designs || [])
    .filter((d: ShootingDesign & { status?: string }) => (d.status === 'completed' || !d.status) && getDesignImageUrl(d));

  const loadingDesigns = !initialDesigns?.length && swrLoadingDesigns;

  const [selectedMannequinIds, setSelectedMannequinIds] = useState<string[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [garmentType, setGarmentType] = useState<string>('T-shirt');
  const [location, setLocation] = useState<string>('studio');
  const [outdoorType, setOutdoorType] = useState<string>('urban');
  const [lighting, setLighting] = useState<string>('soft_natural');
  const [background, setBackground] = useState<string>('neutral_grey');
  const [framing, setFraming] = useState<string>('full_body');
  const [mood, setMood] = useState<string>('lookbook');
  const [hair, setHair] = useState<string>('natural');
  const [makeup, setMakeup] = useState<string>('natural_glow');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [cameraFinish, setCameraFinish] = useState<string>('instagram_pro');
  const [mannequinInstruction, setMannequinInstruction] = useState('');
  const [mannequinPoseOptional, setMannequinPoseOptional] = useState<string>('');
  const [productBackground, setProductBackground] = useState<string>('white');
  const [aspectRatio, setAspectRatio] = useState<string>('3:4');
  const [magicEnhance, setMagicEnhance] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalImageUrl, setPreviewModalImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultProductUrls, setResultProductUrls] = useState<string[]>([]);
  /** Détails de la dernière réalisation (mannequin ou produit). */
  const [lastRealizationDetails, setLastRealizationDetails] = useState<{
    mode: 'mannequin';
    mannequinName: string;
    garmentLabel: string;
    garmentType: string;
    imageSource: 'collection' | 'upload';
    locationLabel: string;
    outdoorLabel?: string;
    lightingLabel: string;
    backgroundLabel: string;
    framingLabel: string;
    moodLabel: string;
    hairLabel: string;
    makeupLabel: string;
    cameraLabel: string;
    mannequinInstruction?: string;
    mannequinPoseLabel?: string;
    scenePrompt: string;
  } | {
    mode: 'product';
    garmentLabel: string;
    garmentType: string;
    imageSource: 'collection' | 'upload';
    backgroundLabel: string;
    angleLabels: readonly string[];
  } | null>(null);
  const [error, setError] = useState('');
  const [showAddMannequinUpload, setShowAddMannequinUpload] = useState(false);
  const [newMannequinName, setNewMannequinName] = useState('');
  const [newMannequinFile, setNewMannequinFile] = useState<File | null>(null);
  const [savingMannequin, setSavingMannequin] = useState(false);
  const [showConfirmPhoto, setShowConfirmPhoto] = useState(false);
  const [showConfirmProduct, setShowConfirmProduct] = useState(false);



  const handleGenerateMannequin = async () => {
    if (selectedMannequinIds.length === 0) {
      setError('Sélectionnez au moins un mannequin (1 à 3)');
      return;
    }
    let designUrl = '';
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('brandId', brandId);
      const uploadRes = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        setError('Erreur lors de l\'upload du design');
        return;
      }
      const uploadData = await uploadRes.json();
      designUrl = uploadData.url;
    } else if (selectedDesignId) {
      const design = designs.find((d) => d.id === selectedDesignId);
      designUrl = getDesignImageUrl(design!) ?? '';
    }
    if (!designUrl) {
      setError('Sélectionnez un vêtement de votre collection ou uploadez une image');
      return;
    }

    const scenePrompt = buildScenePrompt({
      location, outdoorType, lighting, background, framing, mood,
      hair, makeup, accessories: selectedAccessories, props: selectedProps, cameraFinish,
      mannequinInstruction, mannequinPoseOptional,
    });
    setIsGenerating(true);
    setError('');
    setResult(null);
    setResultProductUrls([]);
    try {
      const design = selectedDesignId ? designs.find((d) => d.id === selectedDesignId) : null;
      const garmentLabel = design ? getDesignDisplayName(design) : (uploadedFile?.name ?? undefined);

      const res = await fetch('/api/ugc/shooting-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          mannequinId: selectedMannequinIds[0],
          mannequinIds: selectedMannequinIds,
          designUrl,
          garmentType,
          garmentLabel,
          aspectRatio,
          scenePrompt,
          mannequinInstruction: mannequinInstruction.trim() || undefined,
          mannequinPoseOptional: mannequinPoseOptional || undefined,
          sceneOptions: { location, outdoorType, lighting, background, framing, mood, hair, makeup, cameraFinish },
          magicEnhance,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setResult(data.imageUrl);
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      const mannequinNames = selectedMannequinIds
        .map((id: string) => mannequins.find((m) => m.id === id)?.name ?? 'Mannequin')
        .join(', ');
      setLastRealizationDetails({
        mode: 'mannequin',
        mannequinName: mannequinNames,
        garmentLabel: design ? getDesignDisplayName(design) : (uploadedFile?.name ?? 'Image uploadée'),
        garmentType,
        imageSource: selectedDesignId ? 'collection' : 'upload',
        locationLabel: getOptionLabel(LOCATION_OPTIONS, location),
        outdoorLabel: location === 'outdoor' ? getOptionLabel(OUTDOOR_OPTIONS, outdoorType) : undefined,
        lightingLabel: getOptionLabel(LIGHTING_OPTIONS, lighting),
        backgroundLabel: getOptionLabel(BACKGROUND_OPTIONS, background),
        framingLabel: getOptionLabel(FRAMING_OPTIONS, framing),
        moodLabel: getOptionLabel(MOOD_OPTIONS, mood),
        hairLabel: getOptionLabel(HAIR_OPTIONS, hair),
        makeupLabel: getOptionLabel(MAKEUP_OPTIONS, makeup),
        cameraLabel: getOptionLabel(CAMERA_FINISH_OPTIONS, cameraFinish),
        mannequinInstruction: mannequinInstruction.trim() || undefined,
        mannequinPoseLabel: mannequinPoseOptional ? getPoseOptionLabel(mannequinPoseOptional) : undefined,
        scenePrompt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateProduct = async () => {
    let designUrl = '';
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('brandId', brandId);
      const uploadRes = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        setError('Erreur lors de l\'upload du design');
        return;
      }
      const uploadData = await uploadRes.json();
      designUrl = uploadData.url;
    } else if (selectedDesignId) {
      const design = designs.find((d) => d.id === selectedDesignId);
      designUrl = getDesignImageUrl(design!) ?? '';
    }
    if (!designUrl) {
      setError('Sélectionnez un vêtement de votre collection ou uploadez une image');
      return;
    }
    setIsGenerating(true);
    setError('');
    setResult(null);
    setResultProductUrls([]);
    try {
      const res = await fetch('/api/ugc/shooting-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          designUrl,
          garmentType,
          background: productBackground,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      const urls = Array.isArray(data.imageUrls) ? data.imageUrls : [];
      setResultProductUrls(urls);
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      const design = selectedDesignId ? designs.find((d) => d.id === selectedDesignId) : null;
      setLastRealizationDetails({
        mode: 'product',
        garmentLabel: design ? getDesignDisplayName(design) : (uploadedFile?.name ?? 'Image uploadée'),
        garmentType,
        imageSource: selectedDesignId ? 'collection' : 'upload',
        backgroundLabel: getOptionLabel(PRODUCT_BACKGROUND_OPTIONS, productBackground),
        angleLabels: PRODUCT_ANGLE_LABELS,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMannequinFromUpload = async () => {
    if (!newMannequinName.trim() || !newMannequinFile) {
      setError('Nom et image requis pour ajouter un mannequin');
      return;
    }
    setSavingMannequin(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', newMannequinFile);
      formData.append('brandId', brandId);
      const uploadRes = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Erreur upload');
      const { url } = await uploadRes.json();
      const createRes = await fetch('/api/ugc/mannequins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, name: newMannequinName.trim(), imageUrl: url, source: 'upload' }),
      });
      if (!createRes.ok) {
        const d = await createRes.json();
        throw new Error(d.error || 'Erreur');
      }
      mutate(`/api/ugc/mannequins?brandId=${encodeURIComponent(brandId)}`);
      setShowAddMannequinUpload(false);
      setNewMannequinName('');
      setNewMannequinFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingMannequin(false);
    }
  };

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup
        open={isGenerating}
        title={shootingMode === 'product' ? 'Développement de votre catalogue...' : 'Capture de votre vision créative...'}
        messages={shootingMode === 'product' ? [
          "Mise en place du setup studio...",
          "Ajustement de l'éclairage produit...",
          "Capture des 4 angles de vue...",
          "Optimisation des ombres et reflets...",
        ] : [
          "Installation du décor et mannequins...",
          "Préparation du stylisme IA...",
          "Capture de la pose idéale...",
          "Rendu haute définition du shooting...",
        ]}
      />
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Shooting photo
          </CardTitle>
          <CardDescription>
            Shooting produit uniquement (4 angles) ou shooting avec mannequin. Choisissez le type puis remplissez le formulaire adapté.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Choix du type de shooting */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Type de shooting</label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={shootingMode === 'product' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setShootingMode('product'); setResult(null); setResultProductUrls([]); setLastRealizationDetails(null); }}
                className="gap-2 text-xs"
              >
                <Shirt className="w-3.5 h-3.5" />
                Shooting produit
              </Button>
              <Button
                type="button"
                variant={shootingMode === 'mannequin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setShootingMode('mannequin'); setResult(null); setResultProductUrls([]); setLastRealizationDetails(null); }}
                className="gap-2 text-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Shooting mannequin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {shootingMode === 'product' ? '4 photos produit (face, dos, profils) — formulaire dédié ci-dessous.' : 'Une photo avec le mannequin portant le vêtement. Vous pouvez décrire la pose et choisir des options facultatives.'}
            </p>
          </div>

          {/* ——— Formulaire commun : vêtement (les deux modes) ——— */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Vêtement</label>
            <p className="text-xs text-muted-foreground mb-2">
              Choisissez un vêtement de votre collection ou uploadez une image. Le type se remplit automatiquement si vous choisissez un design.
            </p>
            {loadingDesigns ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Déballage de votre collection…
              </p>
            ) : designs.length > 0 ? (
              <div className="flex flex-wrap gap-3 mb-3">
                {designs.map((d) => {
                  const imgUrl = getDesignImageUrl(d);
                  const name = getDesignDisplayName(d);
                  const selected = selectedDesignId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDesignId(d.id);
                        setGarmentType(d.type);
                        setUploadedFile(null);
                      }}
                      className={cn(
                        'rounded-lg border-[1.5px] p-1.5 text-left transition-all w-24 overflow-hidden',
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50 bg-muted/10'
                      )}
                      disabled={isGenerating}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-1">
                        {imgUrl ? (
                          <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground truncate" title={name}>{name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{d.type}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucun vêtement enregistré. Créez des designs ou uploadez une image ci-dessous.</p>
            )}
            <div className="border-2 border-dashed border-input rounded-lg p-4 text-center bg-muted/20">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { setUploadedFile(e.target.files?.[0] ?? null); setSelectedDesignId(''); }}
                className="hidden"
                id="shooting-design-upload"
              />
              <label htmlFor="shooting-design-upload" className="cursor-pointer text-sm text-muted-foreground">
                {uploadedFile ? `Fichier : ${uploadedFile.name}` : (designs.length > 0 ? 'Ou uploader une image' : 'Uploader une image du vêtement')}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Type de vêtement</label>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isGenerating}
            >
              {GARMENT_TYPES.includes(garmentType as typeof GARMENT_TYPES[number]) ? null : (
                <option value={garmentType}>{garmentType}</option>
              )}
              {GARMENT_TYPES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* ——— Shooting produit uniquement : fond + info 4 angles ——— */}
          {shootingMode === 'product' && (
            <>
              <Card className="bg-muted/20 border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-semibold">Paramètres du shooting produit</CardTitle>
                  <CardDescription className="text-xs">
                    Vous obtiendrez 4 photos : face, dos, profil gauche, profil droit. Choisissez le fond.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <label className="block text-xs font-medium text-foreground mb-2">Fond</label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_BACKGROUND_OPTIONS.map((o) => (
                      <Button
                        key={o.id}
                        type="button"
                        variant={productBackground === o.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProductBackground(o.id)}
                        disabled={isGenerating}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="mb-4">
                <QuotaGenerateButton
                  featureKey="ugc_shooting_product"
                  onClick={() => setShowConfirmProduct(true)}
                  loading={isGenerating}
                  disabled={(!selectedDesignId && !uploadedFile)}
                  title="Shooting Produit (Pack de 4)"
                  description="Générez 4 photos détourées de votre produit (face, dos, profils) pour votre e-commerce."
                  buttonText={isGenerating ? "Développement..." : "Générer les 4 photos"}
                />
              </div>
            </>
          )}

          {/* ——— Shooting mannequin : mannequin + instruction + options facultatives + paramètres scène ——— */}
          {shootingMode === 'mannequin' && (
            <>
              {/* Mannequins : sélection 1 à 3 (clic pour cocher / décocher) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Mannequin(s)
                  </label>
                  {onSwitchToTryOn && (
                    <Button type="button" variant="ghost" size="sm" onClick={onSwitchToTryOn} className="text-primary gap-1">
                      <ImageIcon className="w-4 h-4" />
                      Créer un mannequin dans Virtual Try-On
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">Sélectionnez 1 à 3 mannequins (clic pour cocher / décocher). Les options facultatives s&apos;adaptent au nombre choisi.</p>
                {loadingMannequins ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Préparation des mannequins…
                  </p>
                ) : mannequins.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Aucun mannequin enregistré.</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Créez un rendu dans Virtual Try-On puis cliquez sur « Enregistrer comme mannequin », ou ajoutez une photo ci-dessous.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMannequinUpload(true)} className="gap-2">
                      <Upload className="w-4 h-4" />
                      Ajouter un mannequin (photo)
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {mannequins.map((m) => {
                      const selected = selectedMannequinIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const wasSingle = selectedMannequinIds.length <= 1;
                            let next: string[];
                            if (selected) {
                              next = selectedMannequinIds.filter((id: string) => id !== m.id);
                            } else if (selectedMannequinIds.length < 3) {
                              next = [...selectedMannequinIds, m.id];
                            } else return;
                            setSelectedMannequinIds(next);
                            const nowSingle = next.length <= 1;
                            if (wasSingle !== nowSingle) setMannequinPoseOptional('');
                          }}
                          className={cn(
                            'rounded-lg border-[1.5px] p-1.5 text-left transition-all w-24 overflow-hidden',
                            selected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border hover:border-primary/50 bg-muted/10'
                          )}
                          disabled={isGenerating}
                        >
                          <div className="relative">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted mb-1">
                              <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                            </div>
                            {selected && (
                              <span className="absolute top-1 right-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center font-bold">
                                {selectedMannequinIds.indexOf(m.id) + 1}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-foreground truncate" title={m.name}>{m.name}</p>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowAddMannequinUpload(true)}
                      className="w-24 h-full rounded-lg border-2 border-dashed border-border bg-muted/10 p-2 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                    >
                      <UserPlus className="w-6 h-6" />
                      <span className="text-xs font-medium">Ajouter</span>
                    </button>
                  </div>
                )}

                {showAddMannequinUpload && (
                  <Card className="mt-2 p-3 bg-muted/20">
                    <p className="text-xs font-medium mb-2">Nouveau mannequin (photo)</p>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">Nom</label>
                        <input
                          type="text"
                          value={newMannequinName}
                          onChange={(e) => setNewMannequinName(e.target.value)}
                          placeholder="Ex. Emma"
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs w-32"
                        />
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewMannequinFile(e.target.files?.[0] ?? null)}
                          className="text-xs max-w-[180px]"
                        />
                      </div>
                      <Button size="sm" className="h-7 text-xs px-2" onClick={handleAddMannequinFromUpload} disabled={savingMannequin || !newMannequinName.trim() || !newMannequinFile}>
                        {savingMannequin ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enregistrer'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setShowAddMannequinUpload(false); setNewMannequinFile(null); setNewMannequinName(''); }}>
                        Annuler
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              {/* Ce que vous voulez que le mannequin fasse (libre) */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Instruction libre (pose, action...)</label>
                <textarea
                  value={mannequinInstruction}
                  onChange={(e) => setMannequinInstruction(e.target.value)}
                  placeholder="Ex. : regard caméra, sourire léger, main dans la poche..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[50px] resize-y"
                  disabled={isGenerating}
                />
              </div>

              {/* Options facultatives : pose 1 mannequin ou groupe (2–3) */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-foreground mb-1">Poses suggérées (facultatif)</label>
                {selectedMannequinIds.length <= 1 ? (
                  <div className="flex flex-wrap gap-1">
                    {MANNEQUIN_POSE_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setMannequinPoseOptional(mannequinPoseOptional === o.id ? '' : o.id)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                          mannequinPoseOptional === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                        )}
                        disabled={isGenerating}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {MANNEQUIN_GROUP_POSE_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setMannequinPoseOptional(mannequinPoseOptional === o.id ? '' : o.id)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                          mannequinPoseOptional === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                        )}
                        disabled={isGenerating}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paramètres du shooting : format, lieu, éclairage, fond, cadrage, ambiance (comme en studio photo) */}
              <Card className="bg-muted/20 border-2 border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    Studio Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Format</label>
                      <div className="flex flex-wrap gap-1">
                        {ASPECT_RATIO_OPTIONS.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setAspectRatio(o.id)}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                              aspectRatio === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                            )}
                            disabled={isGenerating}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Cadrage</label>
                      <div className="flex flex-wrap gap-1">
                        {FRAMING_OPTIONS.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setFraming(o.id)}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                              framing === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                            )}
                            disabled={isGenerating}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <details className="group mt-4 bg-background rounded-lg border border-border">
                    <summary className="cursor-pointer text-sm font-semibold hover:bg-muted/50 py-3 px-4 flex items-center justify-between outline-none">
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Réglages Avancés (Mode Pro)</span>
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 space-y-4 border-t border-border mt-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Lieu</label>
                        <div className="flex flex-wrap gap-1">
                          {LOCATION_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setLocation(o.id)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                location === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                              )}
                              disabled={isGenerating}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        {location === 'outdoor' && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {OUTDOOR_OPTIONS.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setOutdoorType(o.id)}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                  outdoorType === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                                )}
                                disabled={isGenerating}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Éclairage</label>
                          <div className="flex flex-wrap gap-1">
                            {LIGHTING_OPTIONS.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setLighting(o.id)}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                  lighting === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                                )}
                                disabled={isGenerating}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Fond</label>
                          <div className="flex flex-wrap gap-1">
                            {BACKGROUND_OPTIONS.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setBackground(o.id)}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                  background === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                                )}
                                disabled={isGenerating}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Ambiance</label>
                        <div className="flex flex-wrap gap-1">
                          {MOOD_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setMood(o.id)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                mood === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                              )}
                              disabled={isGenerating}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Coiffure</label>
                        <div className="flex flex-wrap gap-1">
                          {HAIR_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setHair(o.id)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                hair === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                              )}
                              disabled={isGenerating}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Maquillage</label>
                        <div className="flex flex-wrap gap-1">
                          {MAKEUP_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setMakeup(o.id)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                makeup === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                              )}
                              disabled={isGenerating}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Accessoires</label>
                          <div className="flex flex-wrap gap-1">
                            {ACCESSORIES_OPTIONS.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setSelectedAccessories((prev: string[]) => prev.includes(o.id) ? prev.filter((id: string) => id !== o.id) : [...prev, o.id])}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                  selectedAccessories.includes(o.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                                )}
                                disabled={isGenerating}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Props</label>
                          <div className="flex flex-wrap gap-1">
                            {PROPS_OPTIONS.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setSelectedProps((prev: string[]) => prev.includes(o.id) ? prev.filter((id: string) => id !== o.id) : [...prev, o.id])}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                  selectedProps.includes(o.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                                )}
                                disabled={isGenerating}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Finition Caméra</label>
                        <div className="flex flex-wrap gap-1">
                          {CAMERA_FINISH_OPTIONS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setCameraFinish(o.id)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                                cameraFinish === o.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"
                              )}
                              disabled={isGenerating}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="pt-2 border-t border-border">
                    <p className="font-medium text-xs text-foreground mb-1">Récapitulatif</p>
                    <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                      <li>Mannequin(s) : <span className="text-foreground">{selectedMannequinIds.length > 0 ? selectedMannequinIds.map((id: string) => mannequins.find((m) => m.id === id)?.name ?? '—').join(', ') : '—'}</span></li>
                      <li>Vêtement : <span className="text-foreground">{selectedDesignId ? (() => { const d = designs.find((x) => x.id === selectedDesignId); return d ? getDesignDisplayName(d) : '—'; })() : uploadedFile ? uploadedFile.name : '—'}</span></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
              )}

              {shootingMode === 'mannequin' && (
                <div className="pt-2 mb-4">
                  <QuotaGenerateButton
                    featureKey="ugc_shooting_photo"
                    onClick={() => setShowConfirmPhoto(true)}
                    loading={isGenerating}
                    disabled={(!selectedDesignId && !uploadedFile)}
                    title="Shooting Mannequin IA"
                    description="Générez un rendu ultra-réaliste de votre création portée par le mannequin de votre choix."
                    buttonText={isGenerating ? "Génération en cours..." : "Démarrer le Shooting"}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {(result || resultProductUrls.length > 0) && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Résultat</CardTitle>
            <CardDescription>
              {lastRealizationDetails?.mode === 'product' ? '4 photos produit par angle. Téléchargez et consultez les détails.' : 'Téléchargez l\'image et consultez les détails de la réalisation.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30 cursor-pointer group relative" onClick={() => { setPreviewModalImageUrl(result); setPreviewModalOpen(true); }}>
                <img src={result} alt="Shooting mannequin" className="w-full h-auto transition-opacity group-hover:opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <ZoomIn className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
            )}
            {resultProductUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {resultProductUrls.map((url: string, i: number) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{PRODUCT_ANGLE_LABELS[i] ?? `Photo ${i + 1}`}</p>
                    <div
                      className="rounded-xl overflow-hidden border border-border bg-muted/30 cursor-pointer group relative"
                      onClick={() => { setPreviewModalImageUrl(url); setPreviewModalOpen(true); }}
                    >
                      <img src={url} alt={PRODUCT_ANGLE_LABELS[i]} className="w-full h-auto transition-opacity group-hover:opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `shooting-produit-${PRODUCT_ANGLE_LABELS[i]?.toLowerCase().replace(/\s+/g, '-') ?? i}-${Date.now()}.jpg`;
                        link.click();
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {lastRealizationDetails && lastRealizationDetails.mode === 'mannequin' && (
              <Card className="bg-muted/20 border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Détails de cette réalisation (mannequin)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Mannequin :</span> <strong className="text-foreground">{lastRealizationDetails.mannequinName}</strong></p>
                  <p><span className="text-muted-foreground">Vêtement :</span> <strong className="text-foreground">{lastRealizationDetails.garmentLabel}</strong> · Type : <strong className="text-foreground">{lastRealizationDetails.garmentType}</strong></p>
                  <p><span className="text-muted-foreground">Source image :</span> <strong className="text-foreground">{lastRealizationDetails.imageSource === 'collection' ? 'Collection' : 'Upload'}</strong></p>
                  {lastRealizationDetails.mannequinInstruction && <p><span className="text-muted-foreground">Votre instruction :</span> <strong className="text-foreground">{lastRealizationDetails.mannequinInstruction}</strong></p>}
                  {lastRealizationDetails.mannequinPoseLabel && <p><span className="text-muted-foreground">Pose (option) :</span> <strong className="text-foreground">{lastRealizationDetails.mannequinPoseLabel}</strong></p>}
                  <p><span className="text-muted-foreground">Lieu :</span> <strong className="text-foreground">{lastRealizationDetails.locationLabel}</strong>{lastRealizationDetails.outdoorLabel ? ` (${lastRealizationDetails.outdoorLabel})` : ''}</p>
                  <p><span className="text-muted-foreground">Éclairage :</span> <strong className="text-foreground">{lastRealizationDetails.lightingLabel}</strong> · <span className="text-muted-foreground">Fond :</span> <strong className="text-foreground">{lastRealizationDetails.backgroundLabel}</strong></p>
                  <p><span className="text-muted-foreground">Cadrage :</span> <strong className="text-foreground">{lastRealizationDetails.framingLabel}</strong> · <span className="text-muted-foreground">Ambiance :</span> <strong className="text-foreground">{lastRealizationDetails.moodLabel}</strong></p>
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-2">Prompt scène : <span className="text-foreground break-all">{lastRealizationDetails.scenePrompt}</span></p>
                </CardContent>
              </Card>
            )}
            {lastRealizationDetails && lastRealizationDetails.mode === 'product' && (
              <Card className="bg-muted/20 border">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Détails de cette réalisation (produit)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Vêtement :</span> <strong className="text-foreground">{lastRealizationDetails.garmentLabel}</strong> · Type : <strong className="text-foreground">{lastRealizationDetails.garmentType}</strong></p>
                  <p><span className="text-muted-foreground">Source image :</span> <strong className="text-foreground">{lastRealizationDetails.imageSource === 'collection' ? 'Collection' : 'Upload'}</strong></p>
                  <p><span className="text-muted-foreground">Fond :</span> <strong className="text-foreground">{lastRealizationDetails.backgroundLabel}</strong></p>
                  <p><span className="text-muted-foreground">4 angles :</span> <strong className="text-foreground">{lastRealizationDetails.angleLabels.join(', ')}</strong></p>
                </CardContent>
              </Card>
            )}
            {result && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => onSelectImage?.(result)}
                  className="gap-2 bg-black text-[#25F4EE] hover:bg-black/90 border border-white/10 shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-[#FE2C55]" />
                  Créer un script TikTok pour cette photo
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `shooting-mannequin-${Date.now()}.jpg`;
                    link.click();
                  }}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal plein écran pour consulter la photo */}
      {previewModalOpen && previewModalImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => { setPreviewModalOpen(false); setPreviewModalImageUrl(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo"
        >
          <div
            className="relative max-w-full max-h-full rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewModalImageUrl} alt="Shooting" className="max-h-[90vh] w-auto object-contain rounded-lg" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
              onClick={() => { setPreviewModalOpen(false); setPreviewModalImageUrl(null); }}
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmGenerateModal
        open={showConfirmPhoto}
        onClose={() => setShowConfirmPhoto(false)}
        onConfirm={() => { setShowConfirmPhoto(false); handleGenerateMannequin(); }}
        actionLabel="Générer la photo de shooting (mannequin)"
        remaining={photoQuota?.remaining ?? 0}
        limit={photoQuota?.limit ?? 5}
        loading={isGenerating}
      />
      <ConfirmGenerateModal
        open={showConfirmProduct}
        onClose={() => setShowConfirmProduct(false)}
        onConfirm={() => { setShowConfirmProduct(false); handleGenerateProduct(); }}
        actionLabel="Générer les 4 photos produit"
        remaining={productQuota?.remaining ?? 0}
        limit={productQuota?.limit ?? 1}
        loading={isGenerating}
      />
    </div>
  );
}
