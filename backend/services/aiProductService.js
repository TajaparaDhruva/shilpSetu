/**
 * aiProductService.js
 * ShilpSetu Backend AI Orchestrator Service
 */

import { analyzeCraftImage } from './imageAnalysisService.js';
import { estimateCraftPricing, INDIAN_CRAFT_KNOWLEDGE } from './craftKnowledgeService.js';

export async function generateProductListing(params) {
  return await analyzeCraftImage(params);
}

export function improveProductListing({ title = '', description = '', artisanStory = '' }) {
  const cleanTitle = title.trim();
  const improvedTitle = cleanTitle.toLowerCase().startsWith('handcrafted')
    ? cleanTitle
    : `Handcrafted ${cleanTitle.replace(/^([a-z])/, (c) => c.toUpperCase())}`;

  let improvedDesc = (description || '').trim();
  if (!improvedDesc || improvedDesc.length < 25) {
    improvedDesc = `Exquisitely handcrafted ${cleanTitle} celebrating authentic Indian folk craftsmanship. Meticulously made using time-honored artisanal techniques to bring timeless cultural warmth and elegance to your space.`;
  } else {
    improvedDesc = `${improvedDesc.replace(/\.$/, '')}. Created with traditional hand techniques to ensure enduring quality, organic texture, and distinct heritage charm.`;
  }

  if (artisanStory) {
    improvedDesc += ` Each piece reflects the artisan's personal heritage: "${artisanStory.trim()}".`;
  }

  return {
    success: true,
    improved: {
      originalTitle: cleanTitle,
      improvedTitle,
      originalDescription: description,
      improvedDescription: improvedDesc,
      charCount: improvedDesc.length,
    },
  };
}

export function generateCraftTags({ title = '', description = '', category = '', existingTags = [] }) {
  const combined = `${title} ${description} ${category}`.toLowerCase();
  const tagSet = new Set(['Handmade', 'Artisanal', 'Eco-Friendly']);

  if (combined.includes('pot') || combined.includes('clay') || combined.includes('terracotta')) {
    tagSet.add('Terracotta');
    tagSet.add('Pottery');
    tagSet.add('Home Decor');
    tagSet.add('Clay Art');
  }
  if (combined.includes('textile') || combined.includes('weave') || combined.includes('handloom') || combined.includes('silk')) {
    tagSet.add('Handloom');
    tagSet.add('Textiles');
    tagSet.add('Heritage');
    tagSet.add('Ethnic Wear');
  }
  if (combined.includes('jewel') || combined.includes('kundan') || combined.includes('jhumka')) {
    tagSet.add('Jewellery');
    tagSet.add('Kundan');
    tagSet.add('Festive');
    tagSet.add('Traditional');
  }
  if (combined.includes('wood') || combined.includes('carv')) {
    tagSet.add('Woodcraft');
    tagSet.add('Carving');
    tagSet.add('Home Decor');
  }
  if (combined.includes('metal') || combined.includes('brass') || combined.includes('dhokra')) {
    tagSet.add('Dhokra');
    tagSet.add('Brass Craft');
    tagSet.add('Tribal Art');
  }

  if (category && category !== 'Other') {
    tagSet.add(category.split('&')[0].trim());
  }

  if (Array.isArray(existingTags)) {
    existingTags.forEach((t) => {
      if (t && t.trim()) tagSet.add(t.trim());
    });
  }

  return {
    success: true,
    tags: Array.from(tagSet),
  };
}

