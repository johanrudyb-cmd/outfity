/**
 * Infère la catégorie d'un vêtement à partir de son nom.
 */
export function inferCategory(name: string): string {
  const n = name.toLowerCase();

  if (n.includes('hoodie') || n.includes('sweat') || n.includes('pullover') || n.includes('pull ') || n.includes('capuche')) return 'SWEAT';
  if (n.includes('t-shirt') || n.includes('tee ') || n.includes('tee-shirt') || n.includes('top') || n.includes('body') || n.includes('débardeur') || (n.includes('haut') && !n.includes('bas'))) return 'TSHIRT';
  if (n.includes('polo')) return 'TSHIRT';
  if (n.includes('veste') || n.includes('jacket') || n.includes('blazer') || n.includes('manteau') || n.includes('trench') || n.includes('bomber') || n.includes('blouson') || n.includes('cardigan')) return 'JACKEX';
  if (n.includes('jean') || n.includes('denim')) return 'JEAN';
  if (n.includes('pantalon') || n.includes('pant') || n.includes('chino') || n.includes('cargo') || n.includes('bas') || n.includes('jogging') || n.includes('legging')) return 'PANT';
  if (n.includes('robe') || n.includes('dress') || n.includes('ensemble') || n.includes('jupe') || n.includes('skirt')) return 'DRESS';
  if (n.includes('short')) return 'PANT';

  return 'TSHIRT'; // Default to TSHIRT if unknown
}

/**
 * Infère le style (coupe/type) d'un vêtement.
 */
export function inferStyle(name: string, category: string): string {
  const n = name.toLowerCase();

  // Robes (DRESS)
  if (category === 'DRESS') {
    if (n.includes('mini') || n.includes('courte')) return 'Mini Dress';
    if (n.includes('midi')) return 'Midi Dress';
    if (n.includes('maxi') || n.includes('longue')) return 'Maxi Dress';
    if (n.includes('soirée') || n.includes('cocktail')) return 'Evening Wear';
    if (n.includes('été') || n.includes('plage')) return 'Summer Dress';
    return 'Classic Dress';
  }

  // T-shirts & Hauts
  if (category === 'TSHIRT') {
    if (n.includes('boxy')) return 'Boxy Cut';
    if (n.includes('oversize')) return 'Oversize';
    if (n.includes('body')) return 'Body Suit';
    if (n.includes('crop')) return 'Crop Top';
    if (n.includes('graphic') || n.includes('imprimé')) return 'Graphic Tee';
    return 'Basic Cut';
  }

  // Sweats & Pulls
  if (category === 'SWEAT') {
    if (n.includes('hoodie')) return 'Hoodie';
    if (n.includes('crewneck')) return 'Crewneck';
    if (n.includes('cardigan') || n.includes('gilet')) return 'Cardigan';
    if (n.includes('heavy') || n.includes('épais')) return 'Heavy Weight';
    return 'Knitwear';
  }

  // Vestes & Manteaux
  if (category === 'JACKEX') {
    if (n.includes('blazer')) return 'Blazer';
    if (n.includes('trench')) return 'Trench';
    if (n.includes('bomber')) return 'Bomber';
    if (n.includes('cuir') || n.includes('leather')) return 'Leather Jacket';
    return 'Outerwear';
  }

  // Bas (Jupes, Pantalons, Jeans)
  if (category === 'PANT' || category === 'JEAN') {
    if (n.includes('jupe') || n.includes('skirt')) return 'Skirt';
    if (n.includes('wide') || n.includes('large')) return 'Wide Leg';
    if (n.includes('cargo')) return 'Cargo';
    if (n.includes('slim') || n.includes('skinny')) return 'Slim Fit';
    if (n.includes('baggy')) return 'Baggy';
    return 'Straight Cut';
  }

  return 'Standard';
}
