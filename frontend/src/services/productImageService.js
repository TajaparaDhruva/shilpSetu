/**
 * productImageService.js — Real image resolution for ShilpSetu crafts & products
 */

const colWoodcrafts = require('@/assets/images/shilpsetu/col-woodcrafts.svg');
const colHandlooms = require('@/assets/images/shilpsetu/col-handlooms.svg');
const colAccessories = require('@/assets/images/shilpsetu/col-accessories.svg');
const bannerPottery = require('@/assets/images/shilpsetu/banner-pottery.svg');

const FALLBACK_MAP = {
  pottery: bannerPottery,
  ceramics: bannerPottery,
  'pottery & ceramics': bannerPottery,
  textiles: colHandlooms,
  handlooms: colHandlooms,
  'handloom & textiles': colHandlooms,
  accessories: colAccessories,
  jewellery: colAccessories,
  jewelry: colAccessories,
  woodcrafts: colWoodcrafts,
  woodwork: colWoodcrafts,
  'woodcraft & carving': colWoodcrafts,
};

/**
 * Resolves the display image source for a product:
 * 1. Prioritizes real Supabase Storage / HTTP URLs or local file URIs
 * 2. Falls back to themed craft vector assets based on category/key
 */
export function getProductRealImage(categoryOrKey, rawUrl = null) {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
    return { uri: rawUrl.trim() };
  }

  const key = String(categoryOrKey || '').trim().toLowerCase();
  return FALLBACK_MAP[key] || bannerPottery;
}

export default {
  getProductRealImage,
};

