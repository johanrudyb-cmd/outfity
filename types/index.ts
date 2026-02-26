import type {
    User as PrismaUser,
    Brand as PrismaBrand,
    TrendProduct as PrismaTrendProduct,
    LaunchMap,
    UGCContent,
    Mannequin,
    Design
} from '@prisma/client';

export type User = PrismaUser;

export type Brand = PrismaBrand & {
    launchMap?: LaunchMap | null;
    ugcContents?: UGCContent[];
    mannequins?: Mannequin[];
    designs?: Design[];
};

export type TrendProduct = PrismaTrendProduct;

export type ColorHex = {
    hex: string;
    name: string;
};

// Global augmentation for the Window object if needed
declare global {
    interface Window {
        refreshCategoryTrends?: () => void;
    }
}
