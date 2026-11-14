-- ==============================================================================
-- ShilpSetu: AI Product Assistant Backend, Vision Knowledge & Training Pipeline
-- Migration: 20261114220000_ai_craft_knowledge_and_training.sql
-- ==============================================================================

-- 1. CRAFT KNOWLEDGE BASE
-- Domain-specific Indian handicraft knowledge for RAG and validation
CREATE TABLE IF NOT EXISTS public.craft_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craft_name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  materials TEXT[] NOT NULL DEFAULT '{}',
  techniques TEXT[] NOT NULL DEFAULT '{}',
  typical_features TEXT[] NOT NULL DEFAULT '{}',
  typical_price_min NUMERIC NOT NULL DEFAULT 0,
  typical_price_max NUMERIC NOT NULL DEFAULT 0,
  suggested_tags TEXT[] NOT NULL DEFAULT '{}',
  description_template TEXT NOT NULL,
  cultural_significance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for searching craft knowledge
CREATE INDEX IF NOT EXISTS idx_craft_knowledge_category ON public.craft_knowledge (category);
CREATE INDEX IF NOT EXISTS idx_craft_knowledge_name ON public.craft_knowledge (craft_name);

-- 2. AI GENERATION HISTORY (Audit & Latency Tracking)
CREATE TABLE IF NOT EXISTS public.ai_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  detected_category TEXT,
  detected_craft TEXT,
  generated_title TEXT NOT NULL,
  generated_description TEXT NOT NULL,
  suggested_min_price NUMERIC,
  suggested_max_price NUMERIC,
  suggested_price NUMERIC,
  suggested_tags TEXT[] NOT NULL DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.85,
  detected_features JSONB DEFAULT '{}'::jsonb,
  uncertain_fields TEXT[] DEFAULT '{}',
  model_used TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_artisan ON public.ai_generation_history (artisan_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_created ON public.ai_generation_history (created_at DESC);

-- 3. AI FEEDBACK & ARTISAN CORRECTIONS
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES public.ai_generation_history(id) ON DELETE SET NULL,
  artisan_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('accepted', 'edited', 'rejected')),
  original_suggestion JSONB NOT NULL,
  final_product_data JSONB,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  artisan_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_artisan ON public.ai_feedback (artisan_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_action ON public.ai_feedback (action_taken);

-- 4. AI TRAINING EXAMPLES (Dataset Pipeline for Vision & Prompt Fine-Tuning)
CREATE TABLE IF NOT EXISTS public.ai_training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.ai_feedback(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  verified_title TEXT NOT NULL,
  verified_description TEXT NOT NULL,
  verified_category TEXT NOT NULL,
  verified_tags TEXT[] NOT NULL DEFAULT '{}',
  verified_price NUMERIC,
  craft_domain TEXT,
  expert_verified BOOLEAN NOT NULL DEFAULT FALSE,
  quality_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_training_verified ON public.ai_training_examples (expert_verified);
CREATE INDEX IF NOT EXISTS idx_ai_training_category ON public.ai_training_examples (verified_category);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.craft_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_examples ENABLE ROW LEVEL SECURITY;

-- Craft knowledge is publicly readable by all authenticated users
CREATE POLICY "Allow public read access to craft_knowledge"
  ON public.craft_knowledge FOR SELECT
  USING (true);

-- Artisans can view their own generation history
CREATE POLICY "Artisans can view their own generation history"
  ON public.ai_generation_history FOR SELECT
  USING (auth.uid() = artisan_id);

-- Edge Function / Authenticated artisan can insert generation history
CREATE POLICY "Artisans can insert generation history"
  ON public.ai_generation_history FOR INSERT
  WITH CHECK (auth.uid() = artisan_id);

-- Artisans can submit feedback
CREATE POLICY "Artisans can manage their own feedback"
  ON public.ai_feedback FOR ALL
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

-- Training examples viewable by admin/system
CREATE POLICY "Allow authenticated read of verified training examples"
  ON public.ai_training_examples FOR SELECT
  USING (expert_verified = true OR auth.role() = 'service_role');

-- 6. RPC: Match Craft Knowledge for RAG Prompt Enrichment
CREATE OR REPLACE FUNCTION public.match_craft_knowledge(
  p_query TEXT,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  craft_name TEXT,
  region TEXT,
  category TEXT,
  materials TEXT[],
  techniques TEXT[],
  typical_price_min NUMERIC,
  typical_price_max NUMERIC,
  suggested_tags TEXT[],
  description_template TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.craft_name,
    k.region,
    k.category,
    k.materials,
    k.techniques,
    k.typical_price_min,
    k.typical_price_max,
    k.suggested_tags,
    k.description_template
  FROM public.craft_knowledge k
  WHERE
    p_query ILIKE '%' || k.craft_name || '%'
    OR p_query ILIKE '%' || k.category || '%'
    OR p_query ILIKE '%' || k.region || '%'
    OR array_to_string(k.suggested_tags, ' ') ILIKE '%' || p_query || '%'
  LIMIT p_limit;
END;
$$;

-- 7. RPC: Record Artisan AI Feedback and Auto-Ingest into Training Pipeline
CREATE OR REPLACE FUNCTION public.record_ai_feedback(
  p_generation_id UUID,
  p_action_taken TEXT,
  p_original_suggestion JSONB,
  p_final_product_data JSONB DEFAULT NULL,
  p_user_rating INT DEFAULT 5,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feedback_id UUID;
  v_image_url TEXT;
  v_artisan_id UUID := auth.uid();
BEGIN
  -- Insert into ai_feedback
  INSERT INTO public.ai_feedback (
    generation_id,
    artisan_id,
    action_taken,
    original_suggestion,
    final_product_data,
    user_rating,
    artisan_notes
  ) VALUES (
    p_generation_id,
    v_artisan_id,
    p_action_taken,
    p_original_suggestion,
    p_final_product_data,
    p_user_rating,
    p_notes
  )
  RETURNING id INTO v_feedback_id;

  -- If product was accepted or edited, automatically queue high-quality example into training dataset
  IF p_action_taken IN ('accepted', 'edited') AND p_final_product_data IS NOT NULL THEN
    -- Extract image URL from generation or final data
    v_image_url := COALESCE(
      p_final_product_data->>'image_url',
      p_original_suggestion->>'imageUrl',
      'https://shilpsetu.app/craft.jpg'
    );

    INSERT INTO public.ai_training_examples (
      feedback_id,
      image_url,
      verified_title,
      verified_description,
      verified_category,
      verified_tags,
      verified_price,
      craft_domain,
      expert_verified
    ) VALUES (
      v_feedback_id,
      v_image_url,
      COALESCE(p_final_product_data->>'title', p_original_suggestion->>'title', 'Handcrafted Craft'),
      COALESCE(p_final_product_data->>'description', p_original_suggestion->>'description', 'Authentic Indian handicraft'),
      COALESCE(p_final_product_data->>'category', p_original_suggestion->>'category', 'Pottery & Ceramics'),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_final_product_data->'tags', p_original_suggestion->'tags', '["Handmade"]'::jsonb))),
      COALESCE((p_final_product_data->>'price')::NUMERIC, (p_original_suggestion->>'suggestedPrice')::NUMERIC, 799),
      COALESCE(p_final_product_data->>'category', 'Indian Handicraft'),
      TRUE
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'message', 'Feedback recorded and training example logged'
  );
END;
$$;

-- 8. PRE-SEED AUTHENTIC INDIAN HANDICRAFT DOMAINS
INSERT INTO public.craft_knowledge (
  craft_name, region, category, materials, techniques, typical_features,
  typical_price_min, typical_price_max, suggested_tags, description_template, cultural_significance
) VALUES
(
  'Terracotta Pottery & Earthenware',
  'Gujarat & West Bengal',
  'Pottery & Ceramics',
  ARRAY['Natural Clay', 'Terracotta', 'Organic Slip Paint', 'River Silt'],
  ARRAY['Wheel Throwing', 'Hand Carving', 'Sun Drying', 'Wood-fired Kiln'],
  ARRAY['Earth tone finish', 'Geometric white slip relief motifs', 'Porous clay cooling properties'],
  499,
  1299,
  ARRAY['Terracotta', 'Handmade', 'Pottery', 'Eco-Friendly', 'Home Decor', 'Traditional', 'Clay Art'],
  'Handcrafted terracotta earthenware lovingly sculpted by generational potters using natural clay. Featuring traditional tribal slip etchings, ideal for authentic home aesthetics.',
  'Dating back over 4,000 years to Harappan civilization, Indian terracotta embodies sacred connection to mother earth and sustainable living.'
),
(
  'Kutch & Ahir Embroidery',
  'Kutch, Gujarat',
  'Textiles & Handlooms',
  ARRAY['Handspun Cotton', 'Silk Floss Threads', 'Mirror Work (Abhla)', 'Beads'],
  ARRAY['Chain Stitch', 'Herringbone', 'Buttonhole Stitch', 'Mirror Insertion'],
  ARRAY['Vibrant polychromatic threads', 'Convex mirror reflections', 'Folk geometric patterns'],
  899,
  2499,
  ARRAY['Kutch Embroidery', 'Mirror Work', 'Handloom', 'Textiles', 'Heritage', 'Ethnic', 'Gujarati Art'],
  'Heritage Kutch embroidered textile embellished with hand-anchored convex mirrors (abhla) and intricate polychromatic needlework passed down through generations.',
  'Worn by pastoral nomadic communities of western India to ward off the evil eye and represent radiant desert sunlight.'
),
(
  'Bandhani & Leheriya Tie-Dye',
  'Jamnagar & Rajasthan',
  'Textiles & Handlooms',
  ARRAY['Mulmul Cotton', 'Georgette', 'Natural Vegetable Dyes', 'Gaji Silk'],
  ARRAY['Resist Plucking', 'Thread Tying', 'Step Dip Dyeing'],
  ARRAY['Peeled dot patterns (bhindis)', 'Diagonal ripple wave stripes', 'Crinkled natural silk texture'],
  799,
  2299,
  ARRAY['Bandhani', 'Tie Dye', 'Handloom', 'Ethnic Wear', 'Silk', 'Traditional', 'Festive'],
  'Authentic hand-knotted Bandhani textile created by master dyers who meticulously tie thousands of micro-knots with thread before immersing in vibrant artisanal dyes.',
  'One of the oldest known resist-dyeing traditions in India celebrating festive abundance, weddings, and monsoons.'
),
(
  'Dhokra Brass & Bronze Metalcraft',
  'Bastar, Chhattisgarh & Bengal',
  'Home Decor',
  ARRAY['Recycled Brass', 'Natural Beeswax', 'Clay Core', 'River Sand'],
  ARRAY['Lost-Wax Casting (Cire Perdue)', 'Wire Filigree Shaping', 'Open Pit Smelting'],
  ARRAY['Antique gold patina', 'Rustic textured wire loops', 'Elongated tribal figurines'],
  1199,
  3499,
  ARRAY['Dhokra', 'Lost Wax', 'Brass Craft', 'Tribal Art', 'Metal Sculpture', 'Handmade', 'Heritage Decor'],
  'Exquisite tribal Dhokra sculpture cast using the primitive 4,000-year-old lost-wax technique. Every piece has a distinct one-of-a-kind lost mold silhouette.',
  'Dhokra artifacts are recognized globally as living archaeological metallurgy originating from Mohenjo-Daro dancing girl lineage.'
),
(
  'Jaipur Blue Pottery',
  'Jaipur, Rajasthan',
  'Pottery & Ceramics',
  ARRAY['Quartz Powder', 'Fuller Earth', 'Natural Gum', 'Cobalt Oxide Pigment'],
  ARRAY['Clay-Free Glaze Pressing', 'Freehand Cobalt Painting', 'Low Fire Kiln Glazing'],
  ARRAY['Lustrous turquoise and cobalt palette', 'Floral arabesque foliage', 'Translucent semi-vitreous gloss'],
  699,
  1899,
  ARRAY['Blue Pottery', 'Ceramics', 'Jaipur Craft', 'Cobalt Art', 'Handmade', 'Home Decor', 'Tableware'],
  'Distinctive Jaipur Blue Pottery hand-painted with radiant cobalt foliage and botanical arabesques. Formulated without clay from crushed quartz and fired with smooth vitreous gloss.',
  'Adopted during the reign of Maharaja Sawai Ram Singh II blending Turko-Persian aesthetics with Rajasthani artistry.'
),
(
  'Channapatna Wooden Toys & Carvings',
  'Channapatna, Karnataka',
  'Woodcrafts',
  ARRAY['Ivory Wood (Wrightia Tinctoria)', 'Lac Resin', 'Vegetable Dyes (Turmeric, Indigo)'],
  ARRAY['Lathe Turning', 'Lacquer Polishing', 'Pandanus Leaf Buffing'],
  ARRAY['Mirror smooth glossy polish', 'Vibrant non-toxic candy colors', 'Rounded ergonomic curves'],
  399,
  1199,
  ARRAY['Channapatna', 'Wooden Toys', 'Eco Friendly', 'Non Toxic', 'Woodcraft', 'Artisanal', 'Hand Turned'],
  'GI-tagged Channapatna woodcraft hand-lathed from soft Ivory wood and buffed with natural non-toxic vegetable lacquer. 100% child-safe and eco-conscious.',
  'Introduced in Karnataka by Tipu Sultan who invited Persian artisans to teach ivory-wood lacquering techniques to local toy makers.'
),
(
  'Madhubani / Mithila Folk Painting',
  'Mithila, Bihar',
  'Paintings',
  ARRAY['Handmade Lokta/Cotton Paper', 'Bamboo Twigs', 'Natural Vegetable Pigments (Soot, Turmeric)'],
  ARRAY['Freehand Nib Inking', 'Cross-Hatch Shading', 'Natural Color Infusion'],
  ARRAY['Dual line outlines', 'Surrealist fish, peacock & tree of life motifs', 'Intricate geometric gap fills'],
  799,
  2899,
  ARRAY['Madhubani', 'Mithila Art', 'Folk Painting', 'Traditional', 'Handmade', 'Wall Art', 'Cultural'],
  'Original Madhubani folk painting drawn freehand using bamboo twigs and botanical pigments on textured cotton paper. Features iconic Tree of Life and nature blessing motifs.',
  'Ancient folk style initiated by King Janaka during Sita and Rama wedding; traditionally painted on domestic mud walls by women artisans.'
),
(
  'Kundan & Meenakari Ethnic Jewellery',
  'Jaipur & Gujarat',
  'Jewellery',
  ARRAY['Brass Alloy', 'Kundan Stones', 'Enamel (Meena)', 'Faux Pearls', 'Cotton Cord'],
  ARRAY['Foil Setting', 'Champlevé Enamelling', 'Bead Weaving'],
  ARRAY['Uncut gem facet reflections', 'Vivid enamel reverses', 'Intricate bell jhumka drop fringe'],
  499,
  1799,
  ARRAY['Jewellery', 'Kundan', 'Meenakari', 'Handcrafted', 'Festive', 'Traditional', 'Jhumkas'],
  'Royal Kundan and Meenakari jewellery set handcrafted with bezel-set stones and colorful reverse enamel detailing. Styled with delicate pearl clusters for festive elegance.',
  'Originating from royal Mughal courts and refined by master goldsmiths across Rajasthan and Gujarat.'
)
ON CONFLICT (craft_name) DO UPDATE SET
  materials = EXCLUDED.materials,
  techniques = EXCLUDED.techniques,
  typical_features = EXCLUDED.typical_features,
  typical_price_min = EXCLUDED.typical_price_min,
  typical_price_max = EXCLUDED.typical_price_max,
  suggested_tags = EXCLUDED.suggested_tags,
  description_template = EXCLUDED.description_template,
  cultural_significance = EXCLUDED.cultural_significance;

