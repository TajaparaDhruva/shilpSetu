/**
 * imageAnalysisService.js
 * Multi-provider Vision AI Service (Google Gemini Vision + OpenAI Vision + Indian Craft Heuristics)
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
  let modelUsed = 'heuristic-craft-engine';

  const systemPrompt = `You are the master Indian Handicraft and Artisan Specialist on ShilpSetu.
Analyze this craft photograph carefully.
1. Identify the authentic craft tradition (e.g., Terracotta, Kutch mirror embroidery, Bandhani tie-dye, Dhokra metal, Jaipur blue pottery, Channapatna woodcraft, Madhubani folk painting).
2. Generate an accurate title (e.g. "Handcrafted Terracotta Pot Set").
3. Craft an engaging description between 100 and 280 characters focusing on handwork, texture, materials, and cultural utility. DO NOT hallucinate certifications or fake awards.
4. Categorize into ONE of: "Pottery & Ceramics", "Textiles & Handlooms", "Jewellery", "Woodcrafts", "Home Decor", "Paintings", "Accessories", "Other".
5. Estimate realistic INR pricing (minPrice, maxPrice, suggestedPrice).
6. Return 5 to 7 highly relevant tags.

Artisan optional notes: ${artisanContext || materialsHint || 'None'}

Return ONLY valid JSON:
{
  "title": "Product Title",
  "description": "Description (100-280 chars)",
  "category": "Pottery & Ceramics",
  "minPrice": 699,
  "maxPrice": 899,
  "suggestedPrice": 799,
  "tags": ["Handmade", "Terracotta", "Home Decor", "Traditional", "Eco-Friendly"],
  "detected_features": { "material": "Natural Clay", "craft_tradition": "Terracotta" },
  "confidence": 0.94,
  "uncertain_fields": []
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
          temperature: 0.2,
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

  // 3. Fallback to Craft Knowledge Base matching
  if (!suggestion) {
    const matched = matchCraftDomain(`${imageUrl || ''} ${artisanContext} ${materialsHint}`);
    const pricing = estimateCraftPricing(matched.category, matched);

    suggestion = {
      title: matched.craftName.split('&')[0].trim() + ' Set',
      description: matched.descriptionTemplate,
      category: matched.category,
      minPrice: pricing.minPrice,
      maxPrice: pricing.maxPrice,
      suggestedPrice: pricing.suggestedPrice,
      tags: matched.suggestedTags,
      detected_features: {
        material: matched.materials.join(', '),
        craft_tradition: matched.craftName,
        region: matched.region,
      },
      confidence: pricing.confidence,
      uncertain_fields: [],
    };
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

