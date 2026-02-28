'use client';

import { useState } from 'react';
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface DeletePostButtonProps {
    postId: string;
    postTitle: string;
}

export function DeletePostButton({ postId, postTitle }: DeletePostButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/blog/${postId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            toast({
                title: 'Article supprimé',
                message: `L'article "${postTitle}" a été supprimé avec succès.`,
                type: 'success'
            });

            setShowConfirm(false);
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Erreur',
                message: 'Impossible de supprimer l\'article.',
                type: 'error'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(true)}
                className="h-9 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50"
            >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Supprimer
            </Button>

            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-[24px] shadow-apple-lg border border-black/5 p-8 max-w-md w-full animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#1D1D1F] leading-tight">Supprimer l&apos;article ?</h3>
                                <p className="text-sm text-[#6e6e73] font-medium">Attention, cette action est définitive.</p>
                            </div>
                        </div>

                        <p className="text-sm text-[#1D1D1F] leading-relaxed mb-8">
                            Êtes-vous sûr de vouloir supprimer l&apos;article <span className="font-black italic">&quot;{postTitle}&quot;</span> ? Il disparaîtra immédiatement du blog public.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border-black/5"
                                disabled={isDeleting}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Supprimer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
