/**
 * test-image-recognition-pipeline.js
 * Mandatory Quality & Anti-Contamination Verification Suite
 * Verifies:
 * 1. Traditional earrings photograph generates JEWELLERY details (never pottery/terracotta).
 * 2. Terracotta pot photograph generates POTTERY details (never jewellery).
 * 3. Handcrafted necklace photograph generates JEWELLERY/NECKLACE details.
 * 4. Wooden elephant photograph generates WOODCRAFTS details.
 * 5. Handloom textile photograph generates TEXTILES & HANDLOOMS details.
 * 6. Handcrafted bracelet photograph generates JEWELLERY/BRACELET details.
 * 7. Decorative home product photograph generates HOME DECOR / METAL details.
 * 8. Sequential Test: Uploading an earring photograph IMMEDIATELY after a pottery photograph
 *    proves zero previous-image context or cached terracotta response is reused.
 * 9. Unclear/unrecognized image returns uncertainty response without guessing.
 * 10. Validator catches any cross-contamination or contradictory categorizations.
 */

import { analyzeCraftImage } from '../../backend/services/imageAnalysisService.js';
import { validateAiProductSuggestion } from '../../backend/validators/aiProductValidator.js';
import { matchCraftDomain, estimateCraftPricing, INDIAN_CRAFT_KNOWLEDGE } from '../../backend/services/craftKnowledgeService.js';

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

async function runVerification() {
  console.log('--- TEST SUITE: ShilpSetu AI Product Image Recognition Pipeline ---\n');

  // TEST 1: Traditional Earrings
  console.log('1. Test: Traditional Earrings Photograph');
  const earringsResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/kundan_bell_jhumka_earrings.jpg',
    imageBase64: 'fake_earrings_base64_payload',
    artisanContext: 'Gold tone bell jhumka earrings with kundan stones',
  });
  assert(earringsResult.success === true, 'Earrings analysis returned success');
  assert(earringsResult.suggestion.category === 'Jewellery', `Category is Jewellery (got "${earringsResult.suggestion.category}")`);
  assert(
    earringsResult.suggestion.title.toLowerCase().includes('earring') ||
    earringsResult.suggestion.title.toLowerCase().includes('jhumka'),
    `Title accurately identifies earrings: "${earringsResult.suggestion.title}"`
  );
  assert(!earringsResult.suggestion.description.toLowerCase().includes('terracotta'), 'Description has ZERO mentions of terracotta');
  assert(!earringsResult.suggestion.description.toLowerCase().includes('pot'), 'Description has ZERO mentions of pot');
  assert(earringsResult.suggestion.tags.includes('Jewellery'), 'Contains "Jewellery" tag');

  // TEST 2: Terracotta Pot
  console.log('\n2. Test: Terracotta Pot Photograph');
  const potteryResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/terracotta_earthen_pot.jpg',
    imageBase64: 'fake_pot_base64_payload',
    artisanContext: 'Handmade terracotta water matka clay pot',
  });
  assert(potteryResult.success === true, 'Pottery analysis returned success');
  assert(potteryResult.suggestion.category === 'Pottery & Ceramics', `Category is Pottery & Ceramics (got "${potteryResult.suggestion.category}")`);
  assert(potteryResult.suggestion.title.toLowerCase().includes('terracotta'), `Title identifies terracotta: "${potteryResult.suggestion.title}"`);
  assert(!potteryResult.suggestion.description.toLowerCase().includes('earring'), 'Description has ZERO mentions of earrings');

  // TEST 3: Handcrafted Necklace
  console.log('\n3. Test: Handcrafted Necklace Photograph');
  const necklaceResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/ethnic_choker_necklace.jpg',
    artisanContext: 'Traditional royal choker necklace with pearl drops',
  });
  assert(necklaceResult.suggestion.category === 'Jewellery', 'Necklace categorized as Jewellery');
  assert(necklaceResult.suggestion.title.toLowerCase().includes('necklace') || necklaceResult.suggestion.title.toLowerCase().includes('choker'), 'Identified as necklace');

  // TEST 4: Wooden Elephant
  console.log('\n4. Test: Wooden Elephant Sculpture');
  const woodResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/hand_carved_wooden_elephant.jpg',
    artisanContext: 'Hand-carved wooden elephant sculpture from rosewood',
  });
  assert(woodResult.suggestion.category === 'Woodcrafts', 'Elephant categorized as Woodcrafts');
  assert(woodResult.suggestion.title.toLowerCase().includes('wood'), 'Identified as woodcraft');

  // TEST 5: Handloom Textile
  console.log('\n5. Test: Handloom Textile');
  const textileResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/kutch_handloom_stole_sari.jpg',
    artisanContext: 'Heritage handloom stole with pure silk and kutch mirror work',
  });
  assert(textileResult.suggestion.category === 'Textiles & Handlooms', 'Textile categorized as Textiles & Handlooms');

  // TEST 6: Handcrafted Bracelet
  console.log('\n6. Test: Handcrafted Bracelet');
  const braceletResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/traditional_kada_bangle_bracelet.jpg',
    artisanContext: 'Antique finish brass kada bracelet',
  });
  assert(braceletResult.suggestion.category === 'Jewellery', 'Bracelet categorized as Jewellery');

  // TEST 7: Decorative Home Product (Tribal Dhokra)
  console.log('\n7. Test: Decorative Home Product');
  const homeResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/tribal_dhokra_brass_figurine.jpg',
    artisanContext: 'Bastar tribal dhokra brass metal sculpture',
  });
  assert(homeResult.suggestion.category === 'Home Decor', 'Dhokra categorized as Home Decor');

  // TEST 8: Anti-Contamination Sequential Test (Earrings immediately following Pottery)
  console.log('\n8. Test: Sequential Isolation (Earring immediately following Pottery)');
  // We just executed pottery in Test 2. Now run earrings with completely isolated parameters.
  const sequentialEarring = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/fresh_upload_chandbali_earrings.jpg',
    artisanContext: 'Kundan jhumka earrings with hanging pearls',
  });
  assert(sequentialEarring.suggestion.category === 'Jewellery', 'Sequential request is purely Jewellery');
  assert(!sequentialEarring.suggestion.title.toLowerCase().includes('terracotta'), 'Title has ZERO trace of prior terracotta request');
  assert(!sequentialEarring.suggestion.title.toLowerCase().includes('pot'), 'Title has ZERO trace of prior pot request');

  // TEST 9: Blurry / Unrecognized Product Returns Uncertainty (Rule 8)
  console.log('\n9. Test: Unclear / Ambiguous Image (Rule 8 Compliance)');
  const unclearResult = await analyzeCraftImage({
    imageUrl: 'https://shilpsetu.app/storage/v1/crafts/blurry_unidentifiable_shape_001.jpg',
    artisanContext: '',
    materialsHint: '',
  });
  assert(unclearResult.success === false, 'Ambiguous image correctly rejects confident hallucination');
  assert(unclearResult.error === 'PRODUCT_NOT_RECOGNIZED', 'Returns PRODUCT_NOT_RECOGNIZED error code');

  // TEST 10: Strict Validator Rejects Contradictions
  console.log('\n10. Test: Validator Rejects Jewellery-as-Pottery Contradiction');
  const contradictory = {
    title: 'Kundan Bell Jhumka Earrings',
    description: 'Clay terracotta pot fired in kiln',
    category: 'Pottery & Ceramics',
    minPrice: 499,
    maxPrice: 899,
  };
  const val = validateAiProductSuggestion(contradictory);
  assert(val.isValid === false, 'Validator flags contradiction when jewellery title is assigned pottery category/description');

  console.log(`\n==================================================`);
  console.log(`Results: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`==================================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

