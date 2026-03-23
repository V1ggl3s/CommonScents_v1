export interface Fragrance {
  id: string;
  brand: string;
  perfume: string;
  gender: string | null;
  rating_value: number | null;
  rating_count: number;
  year: number | null;
  concentration: string | null;
  main_accords: string[];
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  perfumer: string | null;
  fragrantica_url: string | null;
  image_url: string | null;
  best_time: string[];
  best_season: string[];
  market_segment: string | null;
  price_estimate_aud: number | null;
  price_sources: PriceSource[] | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceSource {
  source: string;
  aud: number;
  fetched_at: string;
  retailer?: string;
}

export interface SearchResult {
  id: string;
  brand: string;
  perfume: string;
  gender: string | null;
  rating_value: number | null;
  rating_count: number;
  concentration: string | null;
  market_segment: string | null;
  image_url: string | null;
}

export type MarketSegment =
  | "high_end_niche"
  | "designer"
  | "middle_eastern"
  | "mid_tier"
  | "other";

export type Concentration =
  | "cologne"
  | "edt"
  | "edp"
  | "parfum"
  | "extrait";

export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  cologne: "Cologne",
  edt: "Eau de Toilette",
  edp: "Eau de Parfum",
  parfum: "Parfum",
  extrait: "Extrait",
};

export const SEGMENT_LABELS: Record<MarketSegment, string> = {
  high_end_niche: "Niche",
  designer: "Designer",
  middle_eastern: "Middle Eastern",
  mid_tier: "Mid Tier",
  other: "Other",
};
