/**
 * craftKnowledgeService.js
 * ShilpSetu Indian Handicrafts Knowledge Base and RAG Retrieval
 */

export const INDIAN_CRAFT_KNOWLEDGE = [
  {
    id: 'terracotta-pottery',
    craftName: 'Terracotta Pottery & Earthenware',
    region: 'Gujarat & West Bengal',
    category: 'Pottery & Ceramics',
    materials: ['Natural Clay', 'Terracotta', 'Organic Slip Paint', 'River Silt'],
    techniques: ['Wheel Throwing', 'Hand Carving', 'Sun Drying', 'Wood-fired Kiln'],
    typicalFeatures: ['Earth tone finish', 'Geometric white slip relief motifs', 'Porous clay cooling properties'],
    typicalPriceMin: 499,
    typicalPriceMax: 1299,
    suggestedTags: ['Terracotta', 'Handmade', 'Pottery', 'Eco-Friendly', 'Home Decor', 'Traditional', 'Clay Art'],
    descriptionTemplate: 'Handcrafted terracotta earthenware lovingly sculpted by generational potters using natural clay. Featuring traditional tribal slip etchings, ideal for authentic home aesthetics.',
    keywords: ['terracotta', 'pot', 'clay', 'earthen', 'matka', 'vase', 'pottery', 'mud', 'ceramic'],
  },
  {
    id: 'kutch-embroidery',
    craftName: 'Kutch & Ahir Embroidery',
    region: 'Kutch, Gujarat',
    category: 'Textiles & Handlooms',
    materials: ['Handspun Cotton', 'Silk Floss Threads', 'Mirror Work (Abhla)', 'Beads'],
    techniques: ['Chain Stitch', 'Herringbone', 'Buttonhole Stitch', 'Mirror Insertion'],
    typicalFeatures: ['Vibrant polychromatic threads', 'Convex mirror reflections', 'Folk geometric patterns'],
    typicalPriceMin: 899,
    typicalPriceMax: 2499,
    suggestedTags: ['Kutch Embroidery', 'Mirror Work', 'Handloom', 'Textiles', 'Heritage', 'Ethnic', 'Gujarati Art'],
    descriptionTemplate: 'Heritage Kutch embroidered textile embellished with hand-anchored convex mirrors (abhla) and intricate polychromatic needlework passed down through generations.',
    keywords: ['kutch', 'embroidery', 'mirror', 'abhla', 'handloom', 'textile', 'stole', 'dupatta', 'sari', 'gujarat'],
  },
  {
    id: 'bandhani-tie-dye',
    craftName: 'Bandhani & Leheriya Tie-Dye',
    region: 'Jamnagar & Rajasthan',
    category: 'Textiles & Handlooms',
    materials: ['Mulmul Cotton', 'Georgette', 'Natural Vegetable Dyes', 'Gaji Silk'],
    techniques: ['Resist Plucking', 'Thread Tying', 'Step Dip Dyeing'],
    typicalFeatures: ['Peeled dot patterns (bhindis)', 'Diagonal ripple wave stripes', 'Crinkled natural silk texture'],
    typicalPriceMin: 799,
    typicalPriceMax: 2299,
    suggestedTags: ['Bandhani', 'Tie Dye', 'Handloom', 'Ethnic Wear', 'Silk', 'Traditional', 'Festive'],
    descriptionTemplate: 'Authentic hand-knotted Bandhani textile created by master dyers who meticulously tie thousands of micro-knots with thread before immersing in vibrant artisanal dyes.',
    keywords: ['bandhani', 'tie dye', 'leheriya', 'dupatta', 'silk', 'cotton', 'rajasthan', 'jamnagar'],
  },
  {
    id: 'dhokra-metal',
    craftName: 'Dhokra Brass & Bronze Metalcraft',
    region: 'Bastar, Chhattisgarh & Bengal',
    category: 'Home Decor',
    materials: ['Recycled Brass', 'Natural Beeswax', 'Clay Core', 'River Sand'],
    techniques: ['Lost-Wax Casting (Cire Perdue)', 'Wire Filigree Shaping', 'Open Pit Smelting'],
    typicalFeatures: ['Antique gold patina', 'Rustic textured wire loops', 'Elongated tribal figurines'],
    typicalPriceMin: 1199,
    typicalPriceMax: 3499,
    suggestedTags: ['Dhokra', 'Lost Wax', 'Brass Craft', 'Tribal Art', 'Metal Sculpture', 'Handmade', 'Heritage Decor'],
    descriptionTemplate: 'Exquisite tribal Dhokra sculpture cast using the primitive 4,000-year-old lost-wax technique. Every piece has a distinct one-of-a-kind lost mold silhouette.',
    keywords: ['dhokra', 'brass', 'metal', 'bronze', 'tribal', 'figurine', 'bastar', 'sculpture'],
  },
  {
    id: 'channapatna-wood',
    craftName: 'Channapatna Wooden Toys & Carvings',
    region: 'Channapatna, Karnataka',
    category: 'Woodcrafts',
    materials: ['Ivory Wood (Wrightia Tinctoria)', 'Lac Resin', 'Vegetable Dyes (Turmeric, Indigo)'],
    techniques: ['Lathe Turning', 'Lacquer Polishing', 'Pandanus Leaf Buffing'],
    typicalFeatures: ['Mirror smooth glossy polish', 'Vibrant non-toxic candy colors', 'Rounded ergonomic curves'],
    typicalPriceMin: 399,
    typicalPriceMax: 1199,
    suggestedTags: ['Channapatna', 'Wooden Toys', 'Eco Friendly', 'Non Toxic', 'Woodcraft', 'Artisanal', 'Hand Turned'],
    descriptionTemplate: 'GI-tagged Channapatna woodcraft hand-lathed from soft Ivory wood and buffed with natural non-toxic vegetable lacquer. 100% child-safe and eco-conscious.',
    keywords: ['channapatna', 'toy', 'wood', 'lacquer', 'turnery', 'carving', 'timber', 'ivory wood'],
  },
  {
    id: 'kundan-jewellery',
    craftName: 'Kundan & Meenakari Ethnic Jewellery',
    region: 'Jaipur & Gujarat',
    category: 'Jewellery',
    materials: ['Brass Alloy', 'Kundan Stones', 'Enamel (Meena)', 'Faux Pearls', 'Cotton Cord'],
    techniques: ['Foil Setting', 'Champlevé Enamelling', 'Bead Weaving'],
    typicalFeatures: ['Uncut gem facet reflections', 'Vivid enamel reverses', 'Intricate bell jhumka drop fringe'],
    typicalPriceMin: 499,
    typicalPriceMax: 1799,
    suggestedTags: ['Jewellery', 'Kundan', 'Meenakari', 'Handcrafted', 'Festive', 'Traditional', 'Jhumkas'],
    descriptionTemplate: 'Royal Kundan and Meenakari jewellery set handcrafted with bezel-set stones and colorful reverse enamel detailing. Styled with delicate pearl clusters for festive elegance.',
    keywords: ['jewel', 'kundan', 'jhumka', 'earring', 'necklace', 'meenakari', 'bangle', 'festive'],
  },
];

/**
 * Find matching craft by keyword or semantic text
 */
export function matchCraftDomain(query = '') {
  const q = (query || '').toLowerCase();
  for (const item of INDIAN_CRAFT_KNOWLEDGE) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return item;
    }
  }
  return INDIAN_CRAFT_KNOWLEDGE[0]; // Default to Terracotta
}

/**
 * Suggest price range based on craft category and features
 */
export function estimateCraftPricing(category, craftMatch = null) {
  if (craftMatch) {
    return {
      minPrice: craftMatch.typicalPriceMin,
      maxPrice: craftMatch.typicalPriceMax,
      suggestedPrice: Math.round((craftMatch.typicalPriceMin + craftMatch.typicalPriceMax) / 2),
      confidence: 0.92,
    };
  }

  // Category fallback pricing benchmarks in INR
  const benchmarkMap = {
    'Pottery & Ceramics': { min: 499, max: 899, avg: 699 },
    'Textiles & Handlooms': { min: 899, max: 1899, avg: 1299 },
    'Jewellery': { min: 399, max: 999, avg: 599 },
    'Woodcrafts': { min: 699, max: 1599, avg: 1099 },
    'Home Decor': { min: 799, max: 1999, avg: 1299 },
    'Paintings': { min: 750, max: 2400, avg: 1350 },
    'Accessories': { min: 350, max: 850, avg: 550 },
  };

  const bench = benchmarkMap[category] || { min: 499, max: 999, avg: 699 };
  return {
    minPrice: bench.min,
    maxPrice: bench.max,
    suggestedPrice: bench.avg,
    confidence: 0.85,
  };
}

