'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const fashionImages = [
  {
    src: '/fashion/hf_20260131_195003_c7ee5196-eb3f-437e-8261-900b196185fb.png',
    alt: 'Shooting mode 1',
    aspect: 'portrait' as const,
    fallback: '👔',
  },
  {
    src: '/fashion/hf_20260202_064558_2c745b26-af10-4bd1-bc72-6c20c20cbae8.png',
    alt: 'Shooting mode 2',
    aspect: 'portrait' as const,
    fallback: '👗',
  },
  {
    src: '/fashion/hf_20260206_221357_069cdbaa-9fae-417b-a95e-bb863d6fe412.png',
    alt: 'Shooting mode 3',
    aspect: 'portrait' as const,
    fallback: '🧥',
  },
  {
    src: '/fashion/hf_20260208_124626_4fe0953f-e187-4e25-beef-257400d22a65.png',
    alt: 'Shooting mode 4',
    aspect: 'landscape' as const,
    fallback: '👟',
  },
];

export default function FashionGallery() {
  const [isVisible, setIsVisible] = useState(false);

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

    const element = document.getElementById('fashion-gallery');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <section id="fashion-gallery" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] sm:leading-[0.85] mb-6">
            Shootings <br className="hidden sm:block" />
            <span className="text-[#007AFF]">Générés par IA.</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Créez des shootings professionnels sans studio. Notre infrastructure génère des visuels haute-couture pour vos collections.
          </p>
        </div>

        <div
          className={cn(
            'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6',
            'transition-all duration-1000',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          )}
        >
          <div className={cn('relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#F5F5F7]', 'md:row-span-2 col-span-2 sm:col-span-1', 'group cursor-pointer', 'transition-all duration-500 hover:scale-[1.02]')}>
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] lg:min-h-[500px]">
              <Image src={fashionImages[0].src} alt={fashionImages[0].alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
          </div>

          <div className={cn('relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#F5F5F7]', 'group cursor-pointer', 'transition-all duration-500 hover:scale-[1.02]')}>
            <div className="relative w-full h-full min-h-[180px] sm:min-h-[320px] lg:min-h-[400px]">
              <Image src={fashionImages[1].src} alt={fashionImages[1].alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
          </div>

          <div className={cn('relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#F5F5F7]', 'group cursor-pointer', 'transition-all duration-500 hover:scale-[1.02]')}>
            <div className="relative w-full h-full min-h-[180px] sm:min-h-[260px] lg:min-h-[300px]">
              <Image src={fashionImages[2].src} alt={fashionImages[2].alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
          </div>

          <div className={cn('relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#F5F5F7]', 'col-span-2', 'group cursor-pointer', 'transition-all duration-500 hover:scale-[1.02]')}>
            <div className="relative w-full h-full min-h-[200px] sm:min-h-[320px] lg:min-h-[400px]">
              <Image src={fashionImages[3].src} alt={fashionImages[3].alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw" />
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="#pricing-section"
            className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-[#007AFF] text-white rounded-full font-semibold text-base sm:text-lg hover:bg-[#0056CC] transition-all duration-200 group shadow-lg shadow-[#007AFF]/20"
          >
            Créer mes shootings photo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
