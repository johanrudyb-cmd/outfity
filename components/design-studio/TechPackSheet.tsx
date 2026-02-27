'use client';

import Image from 'next/image';
import type { TechPackVisual, TechPackSpeedDemon, TechPackLabelAnnotation } from '@/lib/mockup-and-techpack-types';
import { PLACEMENT_LABEL_EN } from '@/lib/mockup-and-techpack-types';
import { getUnifiedCoordsForMockup } from '@/lib/mockup-techpack-mapping';

/** Traduction des types de labels (config FR → tech pack EN) */
const LABEL_TYPE_EN: Record<string, string> = {
  'Logo devant': 'Front logo',
  'Logo arrière': 'Back logo',
  'Neck tag': 'Neck tag',
  'Logo': 'Logo',
};

function labelTypeToEn(type: string): string {
  return LABEL_TYPE_EN[type] ?? type;
}

function placementToEn(placement: string): string {
  return PLACEMENT_LABEL_EN[placement] ?? placement;
}

/** Traduction des types d'impression (config FR → tech pack EN) */
const PRINT_TYPE_EN: Record<string, string> = {
  'Sérigraphie': 'Screen print',
  'Broderie': 'Embroidery',
  'Transfert thermique': 'Heat transfer',
  'DTF': 'DTF (Direct to Film)',
  'Sublimation': 'Sublimation',
  'Flex': 'Flex / Flock',
  'Vinyle': 'Vinyl',
  'Flock': 'Flock',
  "Pas d'impression": 'No print',
};

function printTypeToEn(v: string): string {
  if (!v || v === '—') return '—';
  return PRINT_TYPE_EN[v] ?? v;
}

/** Traduction des matières (config FR → tech pack EN) */
const FABRIC_EN: Record<string, string> = {
  'Coton 100%': '100% Cotton',
  'Coton jersey': 'Cotton jersey',
  'Coton fleece': 'Cotton fleece',
  'Polyester': 'Polyester',
  'Mélange coton/polyester': 'Cotton/polyester blend',
  'Mélange coton/élasthanne': 'Cotton/elastane blend',
  'French terry': 'French terry',
  'Molleton': 'Fleece',
  'Polyester mesh': 'Polyester mesh',
  'Autre': 'Other',
};

function fabricToEn(v: string): string {
  if (!v || v === '—') return '—';
  return FABRIC_EN[v] ?? v;
}

const HEADER_BG = '#1e3a5f';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  productImageUrl: string | null;
  flatSketchUrl: string | null;
  createdAt: string;
  updatedAt: string;
  techPack: unknown;
  mockupSpec: unknown;
  brand: { name: string | null; logo?: string | null };
}

interface TechPackSheetProps {
  design: Design;
  designerName?: string | null;
  manufacturer?: string | null;
  mainPlacement?: string | null;
}

function formatDate(d: string): string {
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  } catch {
    return '—';
  }
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-white font-bold uppercase text-xs tracking-wide" style={{ backgroundColor: HEADER_BG }}>
      {children}
    </div>
  );
}

/** Flèche d'annotation avec lettre - rouge ou bleu, compacte et précise. */
function AnnotationArrow({
  letter,
  fromX,
  fromY,
  toX,
  toY,
  color,
  isNeckTag,
}: {
  letter: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: 'red' | 'blue';
  isNeckTag?: boolean;
}) {
  const stroke = color === 'red' ? '#dc2626' : '#2563eb';
  const fontSize = isNeckTag ? 5 : 6;
  const r = isNeckTag ? 4 : 5;
  const strokeW = 1;
  return (
    <g>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={stroke} strokeWidth={strokeW} />
      <circle cx={toX} cy={toY} r={r} fill="white" stroke={stroke} strokeWidth={strokeW} />
      <text x={toX} y={toY} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight="bold" fill={stroke} fontFamily="ui-monospace, monospace">
        {letter}
      </text>
    </g>
  );
}

export function TechPackSheet({ design, designerName, manufacturer, mainPlacement }: TechPackSheetProps) {
  const techPack = design.techPack as (TechPackVisual & { speedDemon?: TechPackSpeedDemon }) | null;
  const sd = techPack?.speedDemon;
  const spec = (design.mockupSpec || {}) as Record<string, unknown>;
  const printPlacement = (techPack?.printSpec as { placement?: string })?.placement || (spec.designPlacement as string) || mainPlacement || 'Poitrine (centre)';

  const frontImageUrl = design.productImageUrl || design.flatSketchUrl;
  const backImageUrl = design.flatSketchUrl && design.productImageUrl ? design.flatSketchUrl : null;
  const hasBack = !!backImageUrl && backImageUrl !== frontImageUrl;
  const mockupType = sd?.mockupType || design.type || 'T-shirt';

  const brandName = design.brand?.name ?? '—';
  const brandLogoUrl = design.brand?.logo ?? null;
  const season = ((spec.season as string) || sd?.season) ?? '—';
  const designName = sd?.designName ?? design.type ?? '—';
  const fabric = sd?.fabric ?? design.material ?? '—';
  const category = sd?.category ?? design.type ?? 'TOP';
  const issueNo = sd?.issueNo ?? (design.id ? design.id.slice(-6).toUpperCase() : '—');
  const inDate = sd?.inDate || formatDate(design.createdAt);
  const outDate = sd?.outDate || formatDate(design.updatedAt);

  const sizes = sd?.sizes?.length ? sd.sizes : ['S', 'M', 'L', 'XL'];
  const printType = sd?.printType ?? '—';
  const labels: TechPackLabelAnnotation[] = sd?.labels?.length ? sd.labels : [
    { letter: 'A', imageUrl: sd?.frontDesignUrl ?? design.brand?.logo ?? undefined, widthIn: 14, heightIn: 8, placement: printPlacement, type: 'Logo devant' },
    { letter: 'B', imageUrl: undefined, widthIn: 14, heightIn: 8, placement: 'Dos', type: 'Logo arrière' },
  ];
  const designerLogoUrl = sd?.designerLogoUrl ?? null;
  const designerDisplay = sd?.designerName ?? designerName ?? '—';
  const manufacturerDisplay = sd?.manufacturer ?? manufacturer ?? '—';
  const colorSwatches = sd?.colorSwatches?.length ? sd.colorSwatches : [
    { hex: '#1E5182', label: '' },
    { hex: '#F5F69B', label: '' },
  ];

  const labelCount = labels.length;
  const minHeight = 480 + Math.min(labelCount * (labelCount >= 9 ? 48 : labelCount >= 6 ? 52 : 56), 360);
  const logosCols = labelCount <= 2 ? 2 : labelCount <= 4 ? 2 : labelCount <= 6 ? 3 : 4;
  const logoCompact = labelCount >= 6; // Plus compact quand beaucoup de logos
  const logoVeryCompact = labelCount >= 9;

  return (
    <div
      className="bg-white text-black overflow-hidden font-sans border-[2px] sm:border-[3px] border-black w-full flex flex-col"
      style={{ minHeight: `${minHeight}px` }}
    >
      {/* Rangée 0 : Logo à gauche | Infos | SIZES */}
      <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_1fr] border-b-[2px] sm:border-b-[3px] border-black flex-shrink-0">
        <div className="flex sm:flex-col items-center justify-center p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-black min-w-[100px] bg-white gap-3 sm:gap-1.5">
          {brandLogoUrl ? (
            <div className="relative w-12 h-12 sm:w-20 sm:h-20">
              <Image src={brandLogoUrl} alt={brandName} fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Logo</span>
            </div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight">{brandName}</span>
        </div>
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-black min-h-0">
          <div className="grid grid-cols-2 border-b border-black items-center">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500 h-full flex items-center">BRAND</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{brandName}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black items-center">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500 h-full flex items-center">SEASON</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{season}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black items-center">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500 h-full flex items-center">DESIGN NAME</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{designName}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black items-center">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500 h-full flex items-center">FABRIC</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{fabricToEn(fabric)}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black hidden sm:grid items-center">
            <div className="border-r border-black py-1.5 px-2 font-bold uppercase text-[10px] text-gray-500 h-full flex items-center">PRINT TYPE</div>
            <div className="border-black py-1.5 px-2 text-xs font-medium">{printTypeToEn(printType)}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black hidden sm:grid items-center">
            <div className="border-r border-black py-1.5 px-2 font-bold uppercase text-[10px] text-gray-500 h-full flex items-center">ISSUE NO</div>
            <div className="border-black py-1.5 px-2 text-xs font-medium">{issueNo}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-black items-center">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500 h-full flex items-center">CATEGORY</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{category}</div>
          </div>
          <div className="grid grid-cols-2 sm:border-b border-black">
            <div className="border-r border-black py-1 sm:py-1.5 px-2 font-bold uppercase text-[9px] sm:text-[10px] text-gray-500">IN DATE</div>
            <div className="border-black py-1 sm:py-1.5 px-2 text-[10px] sm:text-xs font-medium">{formatDate(inDate)}</div>
          </div>
          <div className="grid grid-cols-2 sm:hidden border-t border-black">
            <div className="border-r border-black py-1 px-2 font-bold uppercase text-[9px] text-gray-500">PRINT</div>
            <div className="border-black py-1 px-2 text-[10px] font-medium">{printTypeToEn(printType)}</div>
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <PanelHeader>SIZES</PanelHeader>
          <div className="flex-1 min-h-[60px] sm:min-h-[100px] flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white">
            {sizes.map((s) => (
              <div key={s} className="border sm:border-2 border-black px-3 py-1.5 sm:px-5 sm:py-3 font-bold text-xs sm:text-base uppercase">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rangée 1 : THUMBNAIL | LOGOS & DESIGN */}
      <div className="flex flex-col sm:grid sm:grid-cols-[1.4fr_1fr] border-b-[2px] sm:border-b-[3px] border-black flex-1 min-h-[300px]">
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-black min-h-0">
          <PanelHeader>THUMBNAIL</PanelHeader>
          <div className="flex-1 min-h-[260px] sm:min-h-[240px] flex bg-white p-1">
            <div className="relative flex-1 border border-dashed border-gray-300 rounded flex items-stretch justify-stretch bg-gray-50/50 overflow-hidden min-h-[220px]">
              {frontImageUrl ? (
                <>
                  <div className="absolute inset-0 flex">
                    {hasBack && backImageUrl ? (
                      <>
                        <div className="flex-1 relative">
                          <Image src={frontImageUrl} alt="Devant" fill className="object-contain" unoptimized />
                        </div>
                        <div className="flex-1 relative">
                          <Image src={backImageUrl} alt="Dos" fill className="object-contain" unoptimized />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 relative">
                        <Image src={frontImageUrl} alt="Devant + Dos" fill className="object-contain" unoptimized />
                      </div>
                    )}
                  </div>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 100" preserveAspectRatio="none">
                    {labels.map((lb, i) => {
                      const coords = getUnifiedCoordsForMockup(lb.placement, mockupType, i);
                      return (
                        <AnnotationArrow
                          key={lb.letter}
                          letter={lb.letter}
                          fromX={coords.pointOnGarment.x}
                          fromY={coords.pointOnGarment.y}
                          toX={coords.letterPosition.x}
                          toY={coords.letterPosition.y}
                          color={coords.color}
                          isNeckTag={lb.isNeckTag}
                        />
                      );
                    })}
                  </svg>
                </>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] sm:text-xs font-bold uppercase">Devant + Dos</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col min-h-0 bg-gray-50/30">
          <PanelHeader>LOGOS & DESIGN</PanelHeader>
          <div className="flex-1 grid gap-1 p-2 bg-white min-h-0 overflow-auto" style={{ gridTemplateColumns: `repeat(${labelCount > 4 ? 3 : 2}, minmax(0, 1fr))`, gridAutoRows: 'minmax(60px, auto)' }}>
            {labels.map((lb) => (
              <div key={lb.letter} className="border border-black flex flex-col items-center justify-center bg-white p-1.5 min-h-[60px]">
                <span className="font-bold text-primary text-[8px] sm:text-[9px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">[{lb.letter}] {labelTypeToEn(lb.type)}</span>
                {lb.imageUrl ? (
                  <div className="relative w-10 h-8 sm:w-12 sm:h-10 mx-auto shrink-0">
                    <Image src={lb.imageUrl} alt={`${lb.letter}`} fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <span className="text-gray-400 text-[10px]">—</span>
                )}
                <span className="font-bold font-mono mt-0.5 text-red-600 text-[8px] sm:text-[9px]">{lb.widthIn}&quot; × {lb.heightIn}&quot;</span>
                <span className="text-gray-500 mt-0.5 text-[7px] sm:text-[8px] truncate max-w-full">{placementToEn(lb.placement)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rangée 3 : DESIGNER | MANUFACTURER | COLOR SWATCHES */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 border-t-[2px] sm:border-t-[3px] border-black flex-shrink-0">
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-black">
          <PanelHeader>DESIGNER</PanelHeader>
          <div className="bg-white p-2 sm:p-3 min-h-[50px] sm:min-h-[70px] flex items-center justify-center">
            {designerLogoUrl ? (
              <div className="relative w-full h-8 sm:h-10">
                <Image src={designerLogoUrl} alt="Designer" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-medium text-black">{designerDisplay}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-black">
          <PanelHeader>MANUFACTURER</PanelHeader>
          <div className="bg-white p-2 sm:p-3 min-h-[50px] sm:min-h-[70px] flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-black">{manufacturerDisplay}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <PanelHeader>COLOR SWATCHES</PanelHeader>
          <div className="bg-white p-2 sm:p-3 min-h-[50px] sm:min-h-[70px] flex flex-wrap gap-2 items-center justify-center">
            {colorSwatches.slice(0, 6).map((sw, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-8 h-4 sm:w-10 sm:h-6 border border-black shrink-0"
                  style={{ backgroundColor: sw.hex.startsWith('#') ? sw.hex : `#${sw.hex}` }}
                />
                <span className="text-[7px] sm:text-[9px] font-mono text-gray-700">{sw.hex.startsWith('#') ? sw.hex : `#${sw.hex}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <div className="border-t-[2px] sm:border-t-[3px] border-black bg-stone-50 p-3 sm:p-4">
        <p className="text-[9px] sm:text-[10px] text-gray-500 text-center font-bold uppercase tracking-tight leading-relaxed">
          Technical specifications are for prototyping guidance only. <br className="hidden sm:block" />
          Verify all measurements with a professional pattern maker before mass production.
        </p>
      </div>
    </div>
  );
}
