/**
 * aiProductValidator.js
 * Validates AI generated output before returning to clients.
 * Enforces strict object consistency:
 * - Earrings/necklaces/bracelets/rings CANNOT be categorized as pottery.
 * - Pots/ceramics CANNOT be categorized as jewellery.
 * - Rejects hallucinated, contradictory or empty responses.
 */

export const ALLOWED_CATEGORIES = [
  'Jewellery',
  'Pottery & Ceramics',
  'Textiles & Handlooms',
  'Woodcrafts',
  'Home Decor',
  'Paintings',
  'Accessories',
  'Other',
];

export function validateAiProductSuggestion(suggestion) {
  const errors = [];

  if (!suggestion || typeof suggestion !== 'object') {
    return { isValid: false, errors: ['Suggestion must be a valid JSON object'] };
  }

  // Check for error responses from vision model
  if (suggestion.success === false || suggestion.error) {
    return {
      isValid: false,
      errors: [suggestion.message || suggestion.error || 'Product could not be recognized.'],
      sanitized: null,
    };
  }

  // 1. Title Validation
  const title = (suggestion.title || '').trim();
  if (!title || title.length < 3) {
    errors.push('Title is required and must be at least 3 characters.');
  }

  // 2. Category Validation & Consistency Check
  let category = (suggestion.category || '').trim();
  const titleLower = title.toLowerCase();
  const descLower = (suggestion.description || '').toLowerCase();

  // Consistency check: Jewellery vs Pottery
  const isJewelleryObject =
    titleLower.includes('earring') ||
    titleLower.includes('jhumka') ||
    titleLower.includes('necklace') ||
    titleLower.includes('bracelet') ||
    titleLower.includes('bangle') ||
    titleLower.includes('ring') ||
    titleLower.includes('pendant') ||
    titleLower.includes('choker') ||
    titleLower.includes('anklet');

  const isPotteryObject =
    titleLower.includes('pot') ||
    titleLower.includes('matka') ||
    titleLower.includes('vase') ||
    titleLower.includes('clay bowl') ||
    titleLower.includes('terracotta pot') ||
    titleLower.includes('earthenware');

  if (isJewelleryObject && (category.toLowerCase().includes('pottery') || category.toLowerCase().includes('ceramic'))) {
    errors.push('CRITICAL CONTRADICTION: Jewellery object cannot be categorized as Pottery & Ceramics.');
    category = 'Jewellery';
  }

  if (isPotteryObject && (category.toLowerCase().includes('jewel') || category.toLowerCase().includes('ring'))) {
    errors.push('CRITICAL CONTRADICTION: Pottery object cannot be categorized as Jewellery.');
    category = 'Pottery & Ceramics';
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    if (isJewelleryObject) category = 'Jewellery';
    else if (isPotteryObject) category = 'Pottery & Ceramics';
    else category = 'Other';
  }

  suggestion.category = category;

  // 3. Price Validation
  const min = Number(suggestion.minPrice);
  const max = Number(suggestion.maxPrice);
  if (isNaN(min) || min <= 0) {
    errors.push('minPrice must be greater than 0.');
  }
  if (isNaN(max) || max < min) {
    errors.push('maxPrice must be greater than or equal to minPrice.');
  }
  if (!suggestion.suggestedPrice || isNaN(Number(suggestion.suggestedPrice))) {
    suggestion.suggestedPrice = Math.round((min + max) / 2);
  } else {
    suggestion.suggestedPrice = Number(suggestion.suggestedPrice);
  }

  // 4. Description Validation
  const description = (suggestion.description || '').trim();
  if (!description || description.length < 15) {
    errors.push('Description must be at least 15 characters.');
  } else if (description.length > 500) {
    suggestion.description = description.substring(0, 497) + '...';
  } else {
    suggestion.description = description;
  }

  // Contradiction check in description
  if (isJewelleryObject && (descLower.includes('terracotta pot') || descLower.includes('clay pot') || descLower.includes('wheel-thrown'))) {
    errors.push('Description incorrectly contains pottery claims for jewellery.');
  }

  // 5. Tags Validation
  if (!Array.isArray(suggestion.tags) || suggestion.tags.length === 0) {
    suggestion.tags = isJewelleryObject
      ? ['Handmade', 'Jewellery', 'Traditional', 'Ethnic']
      : ['Handmade', 'Artisanal', 'Traditional', 'Eco-Friendly'];
  } else {
    suggestion.tags = suggestion.tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .filter((t) => {
        // Filter out contradictory tags
        if (isJewelleryObject && (t.toLowerCase() === 'pottery' || t.toLowerCase() === 'terracotta pot')) return false;
        if (isPotteryObject && (t.toLowerCase() === 'jewellery' || t.toLowerCase() === 'earrings')) return false;
        return true;
      })
      .slice(0, 10);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: suggestion,
  };
}
