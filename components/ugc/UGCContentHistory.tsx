'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, FileText, Download, Trash2, Edit2, Search, Upload } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UGCContent {
  id: string;
  type: string;
  content: string;
  createdAt: string | Date;
}

interface UGCContentHistoryProps {
  brandId: string;
  contentType: 'virtual_tryon' | 'script';
  onSelect?: (content: UGCContent) => void;
  onEdit?: (content: UGCContent) => void;
}

export function UGCContentHistory({ brandId, contentType, onSelect, onEdit }: UGCContentHistoryProps) {
  const { data, isLoading, mutate } = useSWR<{ contents: UGCContent[] }>(
    brandId ? `/api/ugc/history?brandId=${brandId}&type=${contentType}` : null,
    fetcher
  );

  const contents = data?.contents || [];
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ugc/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const filteredContents = contents.filter((content) => {
    if (contentType === 'script') {
      return content.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Chargement de l'historique...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Historique {contentType === 'virtual_tryon' ? 'Virtual Try-On' : 'Scripts'}
            </CardTitle>
            <CardDescription className="font-medium">
              {filteredContents.length} contenu{filteredContents.length > 1 ? 's' : ''} généré{filteredContents.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          {contentType === 'script' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un script..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredContents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {contentType === 'virtual_tryon' ? (
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Aucun {contentType === 'virtual_tryon' ? 'Virtual Try-On' : 'script'} généré pour le moment
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className="border-2 border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-modern transition-all bg-card"
              >
                {contentType === 'virtual_tryon' ? (
                  <div className="space-y-3">
                    <img
                      src={content.content}
                      alt="Virtual Try-On"
                      className="w-full h-48 object-cover rounded-lg border-2 border-border"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(content.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = content.content;
                            link.download = `virtual-tryon-${content.id}.jpg`;
                            link.click();
                          }}
                          className="border-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        {onSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelect(content)}
                            className="border-2"
                          >
                            Réutiliser
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
                          className="border-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground font-medium line-clamp-4">
                      {content.content}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t-2 border-border">
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(content.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <div className="flex gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(content)}
                            className="border-2"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(content.content)}
                          className="border-2"
                        >
                          Copier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
                          className="border-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
