'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Loader2, ArrowRight, ArrowLeft, MessageCircle, Palette, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';
import { MockupPackSelector } from './MockupPackSelector';
import Link from 'next/link';
import { isFreePlan } from '@/lib/plan-utils';
import { BaseAgentChat } from './BaseAgentChat';

interface PhaseMockupCreationProps {
  brandId: string;
  brand?: BrandIdentity | null;
  onComplete: () => void;
  userPlan?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Renders markdown-like content. Handles __SHOW_MOCKUP_SELECTOR__ magic string
export function MessageContent({ content, isUser, brandId, brandName, userPlan }: { content: string, isUser: boolean, brandId: string, brandName?: string, userPlan?: string }) {
  // Hide suggestions [[...]] and mockup selector from the text bubble
  let displayContent = content.replace(/\[\[.*?\]\]/g, '').trim();

  const matchRender = displayContent.match(/__SHOW_MOCKUP_SELECTOR(?::([a-zA-Z0-9_\-]+))?__/);
  if (matchRender) {
    const typeFilter = matchRender[1];
    const textPart = displayContent.replace(matchRender[0], '').trim();
    return (
      <div className="space-y-4">
        {textPart && <div className="leading-relaxed text-[15px] whitespace-pre-wrap">{textPart}</div>}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-black/5">
          <MockupPackSelector brandId={brandId} brandName={brandName} inline userPlan={userPlan} typeFilter={typeFilter} />
        </div>
      </div>
    );
  }

  // Update internal displayContent for further processing
  const finalContent = displayContent;

  // Handle links like [Option 1](url)
  const parts = finalContent.split(/(\[.*?\]\(.*?\))/g);
  const elements = parts.map((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (match) {
      const [, label, url] = match;
      return (
        <Link
          key={i}
          href={url}
          className={cn(
            "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
            isUser ? "bg-white text-[#007AFF]" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
          )}
        >
          {label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }
    return (
      <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
        {part}
      </span>
    );
  });

  return <div className="leading-relaxed text-[15px]">{elements}</div>;
}

const QUICK_REPLIES = [
  "J'ai un petit budget (Canva ?)",
  "Je maîtrise Photoshop",
  "Je veux déléguer le design",
  "Je veux mon pack mockup",
];

export function PhaseMockupCreation({ brandId, brand, onComplete, userPlan = 'free' }: PhaseMockupCreationProps) {
  const renderMessageContent = (content: string, isUser: boolean) => {
    return <MessageContent content={content} isUser={isUser} brandId={brandId} brandName={brand?.name} userPlan={userPlan} />;
  };

  return (
    <BaseAgentChat
      brandId={brandId}
      userPlan={userPlan}
      agentName="Pharrell"
      agentRole="Direction Artistique"
      agentImage="/images/agents/pharrell_final.png"
      themeColor="bg-[#a032ff]"
      themeHoverColor="hover:bg-[#8e2ce6]"
      themeTextColor="text-[#a032ff]"
      themeGradient="from-[#a032ff] to-[#7b24cc]"
      agentIcon={Palette}
      apiEndpoint="/api/launch-map/mockup-chat"
      storageKey="pharell"
      welcomeTitle="Concevez vos modèles"
      welcomeDescription={<>Je suis <b>Pharrell</b>, ton Directeur Artistique. Je suis là pour t'accompagner dans la création visuelle de ta collection et générer tes mockups.</>}
      welcomePrompts={[
        "Je veux créer un T-shirt streetwear",
        "Je veux designer un Hoodie basique",
        "J'ai besoin de mockups professionnels",
        "Comment créer mon pack tech ?"
      ]}
      welcomeIcons={
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Design Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Création de Mockups</span>
          </div>
        </div>
      }
      renderMessageContent={renderMessageContent}
      onComplete={onComplete}
      upgradeLinkText="Débloquer Mockup Hub"
    />
  );
}
