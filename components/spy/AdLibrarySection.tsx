'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, Music, ExternalLink, Image as ImageIcon, Video } from 'lucide-react';
import { proxyImageUrl } from '@/lib/image-proxy';

interface AdData {
  facebook: Array<{
    title: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    text: string | null;
    link: string | null;
    date: string | null;
  }>;
  tiktok: Array<{
    title: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    text: string | null;
    date: string | null;
  }>;
}

interface AdLibrarySectionProps {
  adData: AdData | null | undefined;
}

export function AdLibrarySection({ adData }: AdLibrarySectionProps) {
  if (!adData || (adData.facebook.length === 0 && adData.tiktok.length === 0)) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-500" />
            <Music className="w-5 h-5 text-black dark:text-white" />
          </div>
          Publicités Actives
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Facebook Ads */}
        {adData.facebook.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Facebook className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-sm">Facebook / Meta Ads</h3>
              <Badge variant="outline" className="ml-auto">
                {adData.facebook.length} active{adData.facebook.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adData.facebook.slice(0, 4).map((ad, index) => (
                <div
                  key={index}
                  className="p-3 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {ad.imageUrl && (
                    <div className="relative mb-2 h-32 rounded overflow-hidden bg-muted">
                      <Image
                        src={proxyImageUrl(ad.imageUrl) || ad.imageUrl || ''}
                        alt={ad.title || 'Publicité Facebook'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {ad.videoUrl && !ad.imageUrl && (
                    <div className="mb-2 rounded overflow-hidden bg-muted flex items-center justify-center h-32">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {ad.text && (
                    <p className="text-sm text-foreground line-clamp-2 mb-2">{ad.text}</p>
                  )}
                  {ad.link && (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Voir la publicité <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {ad.date && (
                    <p className="text-xs text-muted-foreground mt-1">{ad.date}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TikTok Ads */}
        {adData.tiktok.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-4 h-4 text-black dark:text-white" />
              <h3 className="font-semibold text-sm">TikTok Ads</h3>
              <Badge variant="outline" className="ml-auto">
                {adData.tiktok.length} active{adData.tiktok.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adData.tiktok.slice(0, 4).map((ad, index) => (
                <div
                  key={index}
                  className="p-3 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {ad.imageUrl && (
                    <div className="relative mb-2 h-32 rounded overflow-hidden bg-muted">
                      <Image
                        src={proxyImageUrl(ad.imageUrl) || ad.imageUrl || ''}
                        alt={ad.title || 'Publicité TikTok'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {ad.videoUrl && !ad.imageUrl && (
                    <div className="mb-2 rounded overflow-hidden bg-muted flex items-center justify-center h-32">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {ad.text && (
                    <p className="text-sm text-foreground line-clamp-2 mb-2">{ad.text}</p>
                  )}
                  {ad.date && (
                    <p className="text-xs text-muted-foreground mt-1">{ad.date}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          <p>💡 Données extraites depuis les Ad Libraries publiques (Facebook Ad Library, TikTok)</p>
        </div>
      </CardContent>
    </Card>
  );
}
