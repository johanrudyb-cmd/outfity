/**
 * Liste des coupes et détails les plus populaires (Signatures)
 * Classée par catégorie pour une meilleure expérience utilisateur.
 */

export const FASHION_CUTS_BY_CATEGORY = {
    TSHIRT: ['Oversize', 'Boxy', 'Cropped', 'Regular', 'Slim', 'Fitted', 'Col en V', 'Col Rond', 'Col Montant'],
    SWEAT: ['Hoodie Oversize', 'Crewneck Boxy', 'Zip Hoodie', 'Cardigan', 'Maille Lourde', 'Cropped Sweat'],
    JACKEX: ['Bomber', 'Blazer Premium', 'Racing Jacket', 'Varsity', 'Trench', 'Cuir Véritable', 'Puffer'],
    PANT: ['Cargo Wide', 'Carpenter', 'Straight Cut', 'Slim Fit', 'Short Relaxed'],
    JEAN: ['Baggy Denim', 'Flare', 'Straight Cut', 'Slim Fit', 'Maman Jean'],
    DRESS: ['Mini Dress', 'Midi Dress', 'Maxi Dress', 'Evening Wear', 'Summer Dress'],
} as const;

export const ALL_FASHION_CUTS = Array.from(new Set(Object.values(FASHION_CUTS_BY_CATEGORY).flat())).sort();

export type FashionCut = typeof ALL_FASHION_CUTS[number];
