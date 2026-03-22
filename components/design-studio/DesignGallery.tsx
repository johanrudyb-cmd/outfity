'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus, Folder } from 'lucide-react';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  flatSketchUrl: string | null;
  status: string;
  collectionId?: string | null;
  createdAt: Date;
}

interface Collection {
  id: string;
  name: string;
}

interface DesignGalleryProps {
  designs: Design[];
  brandId: string;
  selectedCollectionId?: string | null;
}

export function DesignGallery({ designs, brandId, selectedCollectionId }: DesignGalleryProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`/api/collections?brandId=${brandId}`);
        const data = await response.json();
        if (response.ok) {
          setCollections(data.collections || []);
        }
      } catch (error) {
        console.error('Erreur chargement collections:', error);
      }
    };

    fetchCollections();
  }, [brandId]);

  const handleAssignCollection = async (designId: string, collectionId: string | null) => {
    try {
      const response = await fetch(`/api/designs/${designId}/assign-collection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId }),
      });

      if (response.ok) {
        setAssigningTo(null);
        // Recharger la page pour mettre a jour les designs.
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur assignation collection:', error);
    }
  };

  if (designs.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-8">
            {selectedCollectionId
              ? 'Aucun design dans cette collection'
              : 'Aucun design genere pour le moment'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {selectedCollectionId
            ? `Designs de la collection (${designs.length})`
            : `Mes designs (${designs.length})`}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {designs.map((design) => (
            <div
              key={design.id}
              className="border-2 border-border rounded-xl p-4 hover:border-primary/50 transition-all bg-card"
            >
              <div className="flex items-start gap-4">
                {design.flatSketchUrl && (
                  <Image
                    src={design.flatSketchUrl}
                    alt={design.type}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{design.type}</div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {design.cut} - {design.material}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(design.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs">
                    <span
                      className={`px-2 py-1 rounded font-semibold ${
                        design.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : design.status === 'processing'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {design.status === 'completed'
                        ? 'Termine'
                        : design.status === 'processing'
                        ? 'En cours'
                        : 'En attente'}
                    </span>
                  </div>

                  {design.status === 'completed' && (
                    <div className="relative">
                      <button
                        onClick={() => setAssigningTo(assigningTo === design.id ? null : design.id)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="Assigner a un fichier (collection)"
                      >
                        <FolderPlus className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {assigningTo === design.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-background border-2 border-border rounded-lg shadow-modern-lg z-10">
                          <div className="p-2">
                            <button
                              onClick={() => handleAssignCollection(design.id, null)}
                              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                !design.collectionId
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <Folder className="w-4 h-4 inline mr-2" />
                              Aucun fichier
                            </button>
                            {collections.map((collection) => (
                              <button
                                key={collection.id}
                                onClick={() => handleAssignCollection(design.id, collection.id)}
                                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                  design.collectionId === collection.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted text-foreground'
                                }`}
                              >
                                <Folder className="w-4 h-4 inline mr-2" />
                                {collection.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
