import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import {
    Sparkles,
    Camera,
    PenTool,
    FileText,
    Clock,
    Shirt
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function DashboardRecentActivity() {
    const user = await getCurrentUser();
    if (!user) return null;

    const activities = await prisma.aIUsage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-[#C7C7CC] mb-2" />
                <h3 className="font-bold text-[#1D1D1F] text-sm mb-1">Activité Récente</h3>
                <p className="text-[11px] text-[#86868B] font-medium max-w-[200px]">Lancez l'IA pour voir apparaître votre historique d'activité.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6">
            <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                    <Clock className="w-4 h-4 text-[#007AFF]" />
                </div>
                <h3 className="font-bold text-[#1D1D1F] text-sm">Activité Récente</h3>
            </div>

            <div className="space-y-4">
                {activities.map(act => {
                    let title = "Action IA";
                    let Icon = Sparkles;
                    let color = "text-blue-500";
                    let bg = "bg-blue-50";

                    if (act.feature.includes('scan') || act.feature.includes('hybrid')) {
                        title = "Scanner IVS";
                        Icon = Camera;
                        color = "text-violet-500";
                        bg = "bg-violet-50";
                    } else if (act.feature.includes('logo')) {
                        title = "Génération de Logo";
                        Icon = PenTool;
                        color = "text-pink-500";
                        bg = "bg-pink-50";
                    } else if (act.feature.includes('strategy')) {
                        title = "Stratégie Créateur";
                        Icon = FileText;
                        color = "text-[#007AFF]";
                        bg = "bg-[#007AFF]/10";
                    } else if (act.feature.includes('design') || act.feature.includes('image')) {
                        title = "Génération Visuel";
                        Icon = Shirt;
                        color = "text-orange-500";
                        bg = "bg-orange-50";
                    }

                    return (
                        <div key={act.id} className="flex gap-3 items-center group">
                            <div className={`p-2.5 rounded-xl transition-all ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">{title}</p>
                                <p className="text-[11px] text-[#86868B] mt-0.5">
                                    il y a {formatDistanceToNow(act.createdAt, { locale: fr })}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
