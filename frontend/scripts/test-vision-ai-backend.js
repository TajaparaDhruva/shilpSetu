/**
 * test-vision-ai-backend.js
 * Comprehensive Verification Test for ShilpSetu Vision AI Backend & Training Pipeline
 */

import { analyzeCraftImage } from '../../backend/services/imageAnalysisService.js';
import { matchCraftDomain, estimateCraftPricing, INDIAN_CRAFT_KNOWLEDGE } from '../../backend/services/craftKnowledgeService.js';
import { validateAiProductSuggestion } from '../../backend/validators/aiProductValidator.js';
import { improveProductListing, generateCraftTags } from '../../backend/services/aiProductService.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('--- TEST SUITE: ShilpSetu Vision AI Backend & Training Pipeline ---\n');

  // Test 1: Indian Craft Knowledge RAG Catalog
  console.log('1. Craft Knowledge Retrieval (RAG):');
  assert(INDIAN_CRAFT_KNOWLEDGE.length >= 6, `Knowledge catalog loaded with ${INDIAN_CRAFT_KNOWLEDGE.length} Indian craft domains`);

  const potMatch = matchCraftDomain('authentic handmade terracotta earthen pot with clay patterns');
  assert(potMatch && potMatch.category === 'Pottery & Ceramics', `Identified Terracotta pottery correctly: ${potMatch.craftName}`);

  const handloomMatch = matchCraftDomain('kutch handwoven mirror work silk stole');
  assert(handloomMatch && handloomMatch.category === 'Textiles & Handlooms', `Identified Kutch handloom correctly: ${handloomMatch.craftName}`);

  const dhokraMatch = matchCraftDomain('tribal brass lost-wax sculpture idol');
  assert(dhokraMatch && dhokraMatch.category === 'Home Decor', `Identified Dhokra metalcraft correctly: ${dhokraMatch.craftName}`);

  // Test 2: Price Range Estimator
  console.log('\n2. Price Range & Benchmarking Engine:');
  const priceTest = estimateCraftPricing('Pottery & Ceramics', potMatch);
  assert(priceTest.minPrice === 499 && priceTest.maxPrice === 1299, `Terracotta price range verified (₹${priceTest.minPrice} - ₹${priceTest.maxPrice})`);
  assert(priceTest.suggestedPrice >= priceTest.minPrice && priceTest.suggestedPrice <= priceTest.maxPrice, `Suggested benchmark price ₹${priceTest.suggestedPrice} within bounds`);

  // Test 3: AI Output Validator
  console.log('\n3. Output Sanitization & Validator:');
  const validSuggestion = {
    title: 'Handcrafted Terracotta Pot Set',
    description: 'A beautiful set of handcrafted terracotta pots with traditional Gujarati designs.',
    category: 'Pottery & Ceramics',
    minPrice: 699,
    maxPrice: 899,
    suggestedPrice: 799,
    tags: ['Handmade', 'Terracotta', 'Home Decor'],
  };
  const valResult = validateAiProductSuggestion(validSuggestion);
  assert(valResult.isValid === true, 'Valid craft suggestion approved by validator');

  const invalidSuggestion = {
    title: 'X',
    description: 'Too short',
    category: 'InvalidCat',
    minPrice: -10,
    maxPrice: -50,
  };
  const invalidResult = validateAiProductSuggestion(invalidSuggestion);
  assert(invalidResult.isValid === false && invalidResult.errors.length >= 3, 'Invalid output safely caught with descriptive errors');

  // Test 4: Vision AI Analysis Service
  console.log('\n4. Multi-Modal Vision AI Analyzer:');
  const analysisResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/terracotta-pot.jpg',
    artisanContext: 'Traditional terracotta pot set fired using firewood kiln',
    materialsHint: 'River clay, natural slip paint',
  });

  assert(analysisResult.success === true, 'Vision analysis executed successfully');
  assert(analysisResult.suggestion.category === 'Pottery & Ceramics', `Categorized craft correctly as: ${analysisResult.suggestion.category}`);
  assert(analysisResult.suggestion.title.length > 5, `Generated authentic craft title: "${analysisResult.suggestion.title}"`);
  assert(analysisResult.suggestion.minPrice > 0 && analysisResult.suggestion.suggestedPrice > 0, `Generated realistic price range: ₹${analysisResult.suggestion.minPrice} - ₹${analysisResult.suggestion.maxPrice}`);
  assert(analysisResult.suggestion.tags.includes('Terracotta'), 'Generated relevant domain tag "Terracotta"');
  assert(Boolean(analysisResult.disclaimer), 'Included mandatory artisan pricing disclaimer');

  // Test 5: Improve Listing Service
  console.log('\n5. Listing Improvement Service:');
  const improveResult = improveProductListing({
    title: 'clay vase',
    description: 'Simple pot made by me',
    artisanStory: 'Carrying forward 4 generations of Bhuj potting heritage',
  });
  assert(improveResult.success === true, 'Listing improvement succeeded');
  assert(improveResult.improved.improvedTitle.startsWith('Handcrafted'), `Enhanced title: "${improveResult.improved.improvedTitle}"`);
  assert(improveResult.improved.improvedDescription.includes('heritage'), 'Artisan story woven into enriched description');

  // Test 6: Smart Tags Generator
  console.log('\n6. Smart Tags Generator:');
  const tagResult = generateCraftTags({
    title: 'Kundan Bell Jhumkas',
    description: 'Traditional antique gold-plated jhumkas with pearl beads',
    category: 'Jewellery',
  });
  assert(tagResult.tags.includes('Jewellery') && tagResult.tags.includes('Kundan'), 'Accurately tagged jewelry craft tradition');

  console.log(`\n==================================================`);
  console.log(`Tests Finished: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`==================================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

