import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryAnalysis } from '@/components/trends/CategoryAnalysis';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';

const CATEGORY_MAP: Record<string, string> = {
    't-shirts': 'TSHIRT',
    'sweats': 'SWEAT',
    'vestes': 'JACKEX',
    'pantalons': 'PANT',
    'jeans': 'JEAN',
    'robes': 'DRESS',
};

const LABEL_MAP: Record<string, string> = {
    't-shirts': 'T-Shirts & Hauts',
    'sweats': 'Sweats & Pulls',
    'vestes': 'Vestes & Manteaux',
    'pantalons': 'Pantalons & Bas',
    'jeans': 'Jeans',
    'robes': 'Robes & Ensembles',
};

export default async function CategoryPage({
    params,
    searchParams
}: {
    params: Promise<{ catId: string }>,
    searchParams: Promise<{ segment?: string }>
}) {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');

    const { catId } = await params;
    const { segment } = await searchParams;

    const dbCategory = CATEGORY_MAP[catId.toLowerCase()];
    const label = LABEL_MAP[catId.toLowerCase()];

    if (!dbCategory) {
        redirect('/trends');
    }

    return (
        <DashboardLayout>
            <CategoryAnalysis
                categoryId={dbCategory}
                categoryLabel={label}
                initialSegment={segment || 'homme'}
                userPlan={user.plan}
            />
        </DashboardLayout>
    );
}
