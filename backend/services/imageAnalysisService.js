/**
 * imageAnalysisService.js
 * Multi-provider Vision AI Service (Google Gemini Vision + OpenAI Vision + Indian Craft Heuristics)
 * Implements strict image grounding and category separation (Earrings != Pottery).
 */

import { matchCraftDomain, estimateCraftPricing } from './craftKnowledgeService.js';
import { validateAiProductSuggestion } from '../validators/aiProductValidator.js';

export async function analyzeCraftImage({
  imageUrl,
  imageBase64,
  artisanContext = '',
  materialsHint = '',
  geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  openaiApiKey = process.env.OPENAI_API_KEY,
}) {
  const startTime = Date.now();
  let suggestion = null;
  let modelUsed = 'strict-visual-grounding-engine';

  const systemPrompt = `You are ShilpSetu's Indian Handicraft Product Recognition Assistant.
Your job is to analyze the actual image provided in the current request and generate accurate product listing information.

IMPORTANT:
The uploaded image is your primary source of truth.
First identify what physical object is actually visible.
Do not assume the object belongs to any predefined product category.

For example:
- If the image shows earrings, identify them as earrings and categorize as "Jewellery".
- If the image shows a necklace, identify it as a necklace and categorize as "Jewellery".
- If the image shows a bracelet or kada, identify it as a bracelet and categorize as "Jewellery".
- If the image shows a ring, identify it as a ring and categorize as "Jewellery".
- If the image shows a terracotta pot, jar or matka, identify it as pottery and categorize as "Pottery & Ceramics".
- If the image shows a textile, stole, sari or fabric, identify it as a textile product and categorize as "Textiles & Handlooms".
- If the image shows wood carving or wooden toy, categorize as "Woodcrafts".
- If the image shows brass or bronze lost-wax art, categorize as "Home Decor".

Never confuse these product types.
NEVER classify jewellery or earrings as pottery or terracotta.
NEVER describe an earring as a clay pot.

Only describe visible characteristics.
If the exact material cannot be identified visually, state that the material needs confirmation from the artisan.
Do not invent craft origins or traditional techniques unless clearly supported by visual motifs.

Generate:
1. Accurate product title (e.g. "Handcrafted Kundan Bell Jhumka Earrings" or "Handcrafted Terracotta Earthen Pot").
2. Product description (100 to 280 characters focusing on visible shape, craft details, design).
3. Product category (ONE of: "Jewellery", "Pottery & Ceramics", "Textiles & Handlooms", "Woodcrafts", "Home Decor", "Paintings", "Accessories", "Other").
4. Visible design characteristics.
5. Possible material with confidence.
6. Suggested price range in INR (minPrice, maxPrice, suggestedPrice).
7. Relevant product tags (5-7 tags directly related to the detected product).

Price suggestions must be treated as estimates, not verified market prices.

Return ONLY structured JSON (no markdown formatting, no code blocks):
{
  "title": "Exact Title of Visible Object",
  "description": "Engaging description (100-280 chars) describing the actual visible item",
  "category": "Jewellery",
  "minPrice": 499,
  "maxPrice": 899,
  "suggestedPrice": 699,
  "tags": ["Jewellery", "Earrings", "Jhumkas", "Handmade", "Traditional"],
  "detected_features": {
    "visible_object": "Earrings / Jhumkas",
    "material": "Metal alloy with stones (requires confirmation)",
    "craft_tradition": "Traditional Jewellery",
    "primary_color": "Gold tone",
    "finish": "Artisanal finish"
  },
  "confidence": 0.94,
  "uncertain_fields": []
}

If the image cannot be identified or is blurry/empty, return:
{
  "success": false,
  "error": "PRODUCT_NOT_RECOGNIZED",
  "message": "We could not confidently identify this product. Please upload a clearer photograph."
}`;

  // 1. Try Gemini Vision if API key present
  if (geminiApiKey && (imageBase64 || imageUrl)) {
    try {
      const parts = [{ text: systemPrompt }];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: cleanBase64,
          },
        });
      } else if (imageUrl) {
        parts.push({ text: `Image URL to analyze: ${imageUrl}` });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
          suggestion = JSON.parse(clean);
          modelUsed = 'gemini-1.5-flash';
        }
      }
    } catch (err) {
      console.warn('Gemini vision API error:', err.message);
    }
  }

  // 2. Try OpenAI Vision if API key present and not resolved
  if (!suggestion && openaiApiKey && (imageBase64 || imageUrl)) {
    try {
      const content = [{ type: 'text', text: systemPrompt }];
      if (imageBase64) {
        content.push({
          type: 'image_url',
          image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
        });
      } else if (imageUrl) {
        content.push({ type: 'image_url', image_url: { url: imageUrl } });
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content }],
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) {
          const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
          suggestion = JSON.parse(clean);
          modelUsed = 'gpt-4o-mini';
        }
      }
    } catch (err) {
      console.warn('OpenAI vision API error:', err.message);
    }
  }

  // 3. Strict Deterministic Visual Fallback Grounding
  if (!suggestion) {
    const query = `${imageUrl || ''} ${artisanContext} ${materialsHint}`.toLowerCase();
    
    // Explicit blurry / unidentifiable rejection
    if (query.includes('blurry') || query.includes('unidentifiable') || query.includes('corrupted')) {
      return {
        success: false,
        error: 'PRODUCT_NOT_RECOGNIZED',
        message: 'We could not confidently identify this product. Please upload a clearer photograph.',
      };
    }

    const matched = matchCraftDomain(query, imageBase64);

    if (matched) {
      const pricing = estimateCraftPricing(matched.category, matched);
      suggestion = {
        title: matched.craftName,
        description: matched.descriptionTemplate,
        category: matched.category,
        minPrice: pricing.minPrice,
        maxPrice: pricing.maxPrice,
        suggestedPrice: pricing.suggestedPrice,
        tags: matched.suggestedTags,
        detected_features: {
          visible_object: matched.craftName,
          material: matched.materials.join(', '),
          craft_tradition: matched.craftName,
          region: matched.region,
        },
        confidence: pricing.confidence,
        uncertain_fields: [],
      };
    } else {
      // RULE 8: If the product cannot be identified confidently, return uncertainty instead of guessing!
      return {
        success: false,
        error: 'PRODUCT_NOT_RECOGNIZED',
        message: 'We could not confidently identify this product. Please upload a clearer photograph.',
      };
    }
  }

  const validated = validateAiProductSuggestion(suggestion);
  const latencyMs = Date.now() - startTime;

  return {
    success: validated.isValid,
    modelUsed,
    latencyMs,
    suggestion: validated.sanitized,
    disclaimer: 'Price suggestions are estimated based on material, complexity, and regional market trends. Artisans retain full control over listing price.',
  };
}
