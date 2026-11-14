/**
 * aiProductValidator.js
 * Validates AI generated output before returning to clients
 */

const ALLOWED_CATEGORIES = [
  'Pottery & Ceramics',
  'Textiles & Handlooms',
  'Jewellery',
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

  // 1. Title
  if (!suggestion.title || typeof suggestion.title !== 'string' || suggestion.title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters.');
  }

  // 2. Category
  if (!suggestion.category || !ALLOWED_CATEGORIES.includes(suggestion.category)) {
    suggestion.category = 'Other';
  }

  // 3. Price validation
  const min = Number(suggestion.minPrice);
  const max = Number(suggestion.maxPrice);
  if (isNaN(min) || min <= 0) {
    errors.push('minPrice must be greater than 0.');
  }
  if (isNaN(max) || max < min) {
    errors.push('maxPrice must be greater than or equal to minPrice.');
  }
  if (!suggestion.suggestedPrice || isNaN(suggestion.suggestedPrice)) {
    suggestion.suggestedPrice = Math.round((min + max) / 2);
  }

  // 4. Description length: optimal 100-300 characters
  if (!suggestion.description || typeof suggestion.description !== 'string' || suggestion.description.trim().length < 20) {
    errors.push('Description must be at least 20 characters.');
  } else if (suggestion.description.length > 500) {
    suggestion.description = suggestion.description.substring(0, 497) + '...';
  }

  // 5. Tags validation
  if (!Array.isArray(suggestion.tags) || suggestion.tags.length === 0) {
    suggestion.tags = ['Handmade', 'Artisanal', 'Traditional', 'Eco-Friendly'];
  } else {
    suggestion.tags = suggestion.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 10);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: suggestion,
  };
}

