'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Folder, X, Edit2, Trash2 } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  _count: {
    designs: number;
  };
}

interface CollectionsManagerProps {
  brandId: string;
  onCollectionSelect?: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
}

export function CollectionsManager({
  brandId,
  onCollectionSelect,
  selectedCollectionId,
}: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections?brandId=${brandId}`);
      const data = await response.json();
      if (response.ok) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Erreur chargement collections:', error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCollections([data.collection, ...collections]);
        setFormData({ name: '', description: '' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Erreur création collection:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCollections(
          collections.map((c) => (c.id === id ? { ...data, _count: c._count } : c))
        );
        setFormData({ name: '', description: '' });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Erreur mise à jour collection:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette collection ?')) return;

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCollections(collections.filter((c) => c.id !== id));
        if (selectedCollectionId === id && onCollectionSelect) {
          onCollectionSelect(null);
        }
      }
    } catch (error) {
      console.error('Erreur suppression collection:', error);
    }
  };

  const startEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.description || '',
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Chargement des collections...
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
            <CardTitle className="text-xl font-bold">Fichiers (collections)</CardTitle>
            <CardDescription className="font-medium">
              Organisez vos designs et articles (rentabilité, scripts UGC) par fichier
            </CardDescription>
          </div>
          {!showCreateForm && !editingId && (
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="shadow-modern"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nouveau fichier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire création/édition */}
        {(showCreateForm || editingId) && (
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-border space-y-3">
            <Input
              type="text"
              placeholder="Nom du fichier"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-2"
            />
            <Input
              type="text"
              placeholder="Description (optionnel)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-2"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                disabled={!formData.name.trim()}
                className="shadow-modern"
              >
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEdit();
                }}
                className="border-2"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Liste collections */}
        <div className="space-y-2">
          {/* Option "Tous les designs" */}
          <button
            onClick={() => onCollectionSelect?.(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              selectedCollectionId === null
                ? 'border-primary bg-primary/10 shadow-modern'
                : 'border-border hover:border-primary/50 bg-card'
            }`}
          >
            <Folder className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Tous les designs</div>
            </div>
          </button>

          {collections.map((collection) => (
            <div
              key={collection.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                selectedCollectionId === collection.id
                  ? 'border-primary bg-primary/10 shadow-modern'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <button
                onClick={() => onCollectionSelect?.(collection.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <Folder className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{collection.name}</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {collection._count.designs} design{collection._count.designs > 1 ? 's' : ''}
                  </div>
                </div>
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(collection)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(collection.id)}
                  className="p-1.5 hover:bg-error/10 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          ))}

          {collections.length === 0 && !showCreateForm && (
            <p className="text-sm text-muted-foreground font-medium text-center py-4">
              Aucun fichier. Créez-en un pour regrouper designs, calculs de rentabilité et scripts UGC.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
