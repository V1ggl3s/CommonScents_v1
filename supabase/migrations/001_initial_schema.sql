-- CommonScents: Initial Schema
-- Enables required extensions and creates all core tables.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- FRAGRANCES
-- ============================================================

CREATE TABLE IF NOT EXISTS fragrances (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand           text NOT NULL,
    perfume         text NOT NULL,
    gender          text,
    rating_value    numeric,           -- 0-10 scale
    rating_count    integer DEFAULT 0,
    year            integer,
    concentration   text,              -- cologne, edt, edp, parfum, extrait
    main_accords    text[] DEFAULT '{}',
    top_notes       text[] DEFAULT '{}',
    middle_notes    text[] DEFAULT '{}',
    base_notes      text[] DEFAULT '{}',
    perfumer        text,
    fragrantica_url text,
    image_url       text,
    best_time       text[] DEFAULT '{}',   -- ['day'], ['night'], or ['day','night']
    best_season     text[] DEFAULT '{}',   -- up to 2: ['spring','summer'] etc.
    market_segment  text,                  -- high_end_niche, designer, middle_eastern, mid_tier, other
    price_estimate_aud numeric,
    price_sources   jsonb,
    price_updated_at timestamptz,
    searchable_text tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(brand, '') || ' ' || coalesce(perfume, ''))
    ) STORED,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    CONSTRAINT fragrances_brand_perfume_unique UNIQUE (brand, perfume),
    CONSTRAINT fragrances_concentration_check CHECK (
        concentration IS NULL OR concentration IN ('cologne', 'edt', 'edp', 'parfum', 'extrait')
    ),
    CONSTRAINT fragrances_market_segment_check CHECK (
        market_segment IS NULL OR market_segment IN ('high_end_niche', 'designer', 'middle_eastern', 'mid_tier', 'other')
    )
);

CREATE INDEX idx_fragrances_searchable ON fragrances USING gin(searchable_text);
CREATE INDEX idx_fragrances_brand_trgm ON fragrances USING gin(brand gin_trgm_ops);
CREATE INDEX idx_fragrances_perfume_trgm ON fragrances USING gin(perfume gin_trgm_ops);
CREATE INDEX idx_fragrances_rating_count ON fragrances (rating_count DESC NULLS LAST);
CREATE INDEX idx_fragrances_market_segment ON fragrances (market_segment) WHERE market_segment IS NOT NULL;


-- ============================================================
-- BRANDS (default market segment per brand)
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL UNIQUE,
    default_segment text,
    CONSTRAINT brands_segment_check CHECK (
        default_segment IS NULL OR default_segment IN ('high_end_niche', 'designer', 'middle_eastern', 'mid_tier', 'other')
    )
);


-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name                text,
    username            text UNIQUE,
    email               text,
    preferred_currency  text DEFAULT 'AUD',
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_username ON profiles (username);

-- Auto-create profile on new auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- USER RATINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_ratings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fragrance_id    uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    rating          smallint NOT NULL CHECK (rating >= 1 AND rating <= 10),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (user_id, fragrance_id)
);

CREATE INDEX idx_user_ratings_fragrance ON user_ratings (fragrance_id);

-- Trigger: recalculate fragrances.rating_value and rating_count on rating changes
CREATE OR REPLACE FUNCTION recalculate_fragrance_rating()
RETURNS trigger AS $$
DECLARE
    curr_value numeric;
    curr_count integer;
BEGIN
    SELECT rating_value, rating_count
    INTO curr_value, curr_count
    FROM fragrances
    WHERE id = COALESCE(NEW.fragrance_id, OLD.fragrance_id);

    curr_value := COALESCE(curr_value, 0);
    curr_count := COALESCE(curr_count, 0);

    IF TG_OP = 'INSERT' THEN
        UPDATE fragrances SET
            rating_value = (curr_value * curr_count + NEW.rating)::numeric / (curr_count + 1),
            rating_count = curr_count + 1,
            updated_at = now()
        WHERE id = NEW.fragrance_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Subtract old, add new; count stays the same
        IF curr_count > 0 THEN
            UPDATE fragrances SET
                rating_value = (curr_value * curr_count - OLD.rating + NEW.rating)::numeric / curr_count,
                updated_at = now()
            WHERE id = NEW.fragrance_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        IF curr_count > 1 THEN
            UPDATE fragrances SET
                rating_value = (curr_value * curr_count - OLD.rating)::numeric / (curr_count - 1),
                rating_count = curr_count - 1,
                updated_at = now()
            WHERE id = OLD.fragrance_id;
        ELSE
            UPDATE fragrances SET
                rating_value = 0,
                rating_count = 0,
                updated_at = now()
            WHERE id = OLD.fragrance_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_rating_change
    AFTER INSERT OR UPDATE OR DELETE ON user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_fragrance_rating();


-- ============================================================
-- COLLECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS collections (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        text NOT NULL,
    is_public   boolean DEFAULT false,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id   uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    fragrance_id    uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    added_at        timestamptz DEFAULT now(),
    UNIQUE (collection_id, fragrance_id)
);


-- ============================================================
-- WISHLISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public   boolean DEFAULT false,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id     uuid NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    fragrance_id    uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    added_at        timestamptz DEFAULT now(),
    UNIQUE (wishlist_id, fragrance_id)
);


-- ============================================================
-- FRAGRANCE RELATIONSHIPS (similar, clone_of, inspired_by)
-- ============================================================

CREATE TABLE IF NOT EXISTS fragrance_relationships (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_fragrance_id     uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    target_fragrance_id     uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    relationship_type       text NOT NULL,  -- similar, clone_of, inspired_by, often_compared
    direction_hint          text,           -- cheaper_alternative, luxury_reference
    confidence              numeric DEFAULT 1.0,
    source_attribution      text,           -- curated, community_vote, import_batch
    notes                   text,
    created_at              timestamptz DEFAULT now(),

    CONSTRAINT no_self_relationship CHECK (source_fragrance_id != target_fragrance_id)
);

CREATE INDEX idx_frag_rel_source ON fragrance_relationships (source_fragrance_id);
CREATE INDEX idx_frag_rel_target ON fragrance_relationships (target_fragrance_id);
CREATE INDEX idx_frag_rel_type ON fragrance_relationships (relationship_type);


-- ============================================================
-- USER PRICE REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_price_reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fragrance_id    uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    amount          numeric NOT NULL CHECK (amount > 0),
    currency        text NOT NULL DEFAULT 'AUD',
    reported_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_price_reports_fragrance ON user_price_reports (fragrance_id);


-- ============================================================
-- FX RATES (cached daily)
-- ============================================================

CREATE TABLE IF NOT EXISTS fx_rates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    base        text NOT NULL,
    target      text NOT NULL,
    rate        numeric NOT NULL,
    fetched_at  timestamptz DEFAULT now(),
    UNIQUE (base, target)
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_price_reports ENABLE ROW LEVEL SECURITY;

-- Fragrances: public read
CREATE POLICY "Fragrances are viewable by everyone"
    ON fragrances FOR SELECT USING (true);

-- Profiles: public read, owner update
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- User ratings: public read, owner CUD
CREATE POLICY "Ratings are viewable by everyone"
    ON user_ratings FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings"
    ON user_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON user_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
    ON user_ratings FOR DELETE USING (auth.uid() = user_id);

-- Collections: owner sees all; public sees is_public=true
CREATE POLICY "Users can view own collections"
    ON collections FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own collections"
    ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
    ON collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
    ON collections FOR DELETE USING (auth.uid() = user_id);

-- Collection items: visible if collection is accessible
CREATE POLICY "Collection items viewable if collection accessible"
    ON collection_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM collections c
        WHERE c.id = collection_id AND (c.user_id = auth.uid() OR c.is_public = true)
    ));

CREATE POLICY "Users can manage own collection items"
    ON collection_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own collection items"
    ON collection_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid()
    ));

-- Wishlists: owner only (always private)
CREATE POLICY "Users can view own wishlists"
    ON wishlists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlists"
    ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists"
    ON wishlists FOR DELETE USING (auth.uid() = user_id);

-- Wishlist items
CREATE POLICY "Users can view own wishlist items"
    ON wishlist_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage own wishlist items"
    ON wishlist_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own wishlist items"
    ON wishlist_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()
    ));

-- Price reports: public read, owner insert
CREATE POLICY "Price reports are viewable by everyone"
    ON user_price_reports FOR SELECT USING (true);

CREATE POLICY "Users can submit price reports"
    ON user_price_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fragrance relationships: public read
ALTER TABLE fragrance_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relationships are viewable by everyone"
    ON fragrance_relationships FOR SELECT USING (true);

-- Brands: public read
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands are viewable by everyone"
    ON brands FOR SELECT USING (true);

-- FX rates: public read
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FX rates are viewable by everyone"
    ON fx_rates FOR SELECT USING (true);
