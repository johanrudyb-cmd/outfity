'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Hash, Plus, Trash2, Rocket, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TrackedHashtag {
    id: string;
    hashtag: string;
    category: string | null;
    isActive: boolean;
    createdAt: string;
}

export function TrackedHashtagsManager() {
    const [hashtags, setHashtags] = useState<TrackedHashtag[]>([]);
    const [loading, setLoading] = useState(true);
    const [newHashtag, setNewHashtag] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchHashtags();
    }, []);

    const fetchHashtags = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/hashtags');
            if (res.ok) {
                setHashtags(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHashtag.trim()) return;

        setAdding(true);
        try {
            const res = await fetch('/api/admin/hashtags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashtag: newHashtag })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur inconnue');
            }

            const added = await res.json();
            setHashtags([added, ...hashtags]);
            setNewHashtag('');
            toast.success('Hashtag ajouté au radar TikTok');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string, hashtag: string) => {
        if (!confirm(`Supprimer le suivi pour #${hashtag} ?`)) return;

        try {
            const res = await fetch(`/api/admin/hashtags/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHashtags(hashtags.filter(h => h.id !== id));
                toast.success('Hashtag supprimé');
            }
        } catch (e) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/admin/hashtags/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !current })
            });
            if (res.ok) {
                setHashtags(hashtags.map(h => h.id === id ? { ...h, isActive: !current } : h));
            }
        } catch (e) {
            toast.error('Erreur');
        }
    };

    return (
        <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden h-full">
            <CardHeader className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black italic tracking-tight uppercase">Radar TikTok</CardTitle>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Mots-clés surveillés</p>
                        </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                        {hashtags.filter(h => h.isActive).length} Actifs
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Ex: vintage, streetwear, gorpcore..."
                            className="pl-9 h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:border-purple-500 font-medium"
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            disabled={adding}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={adding || !newHashtag.trim()}
                        className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </Button>
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : hashtags.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-600">Aucun hashtag surveillé</p>
                            <p className="text-xs text-gray-400 mt-1">L'IA utilise uniquement sa liste intégrée.</p>
                        </div>
                    ) : (
                        hashtags.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleActive(item.id, item.isActive)}
                                        className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}
                                        title={item.isActive ? 'Désactiver' : 'Activer'}
                                    />
                                    <span className={`font-semibold text-sm ${item.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                        #{item.hashtag}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(item.id, item.hashtag)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
