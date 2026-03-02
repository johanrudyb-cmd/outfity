'use client';

import { useState } from 'react';
import { updateUserPlan } from './actions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

interface PlanSelectorProps {
    userId: string;
    initialPlan: string;
}

export function PlanSelector({ userId, initialPlan }: PlanSelectorProps) {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(initialPlan);

    const handlePlanChange = async (newPlan: string) => {
        setLoading(true);
        try {
            const result = await updateUserPlan(userId, newPlan);
            if (result.success) {
                setPlan(newPlan);
                toast.success(`Plan mis à jour : ${newPlan}`);
            } else {
                toast.error(result.error || 'Erreur lors de la mise à jour');
            }
        } catch (err) {
            toast.error('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select
            defaultValue={plan}
            onValueChange={handlePlanChange}
            disabled={loading}
        >
            <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Choisir un plan" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="starter" className="text-[10px] font-black uppercase italic tracking-widest">Starter</SelectItem>
                <SelectItem value="creator" className="text-[10px] font-black uppercase italic tracking-widest text-[#007AFF]">Créateur</SelectItem>
            </SelectContent>
        </Select>
    );
}
