/**
 * aiProductRoutes.js
 * ShilpSetu Express/Node.js API Route Handler for AI Product Assistant
 */

import { generateProductListing, improveProductListing, generateCraftTags } from '../services/aiProductService.js';

export async function handleAiProductRequest(req, res) {
  const { action } = req.body || {};

  try {
    if (action === 'generate_product') {
      const result = await generateProductListing(req.body);
      return res.status(200).json(result);
    }

    if (action === 'improve_listing') {
      const result = improveProductListing(req.body);
      return res.status(200).json(result);
    }

    if (action === 'generate_tags') {
      const result = generateCraftTags(req.body);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid or missing action in request body' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

