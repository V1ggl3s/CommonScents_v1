"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Fragrance } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";

const SEGMENT_LABELS: Record<string, string> = {
  high_end_niche: "Niche",
  designer: "Designer",
  middle_eastern: "Middle Eastern",
  mid_tier: "Mid Tier",
  other: "Other",
};

const CONCENTRATION_LABELS: Record<string, string> = {
  cologne: "EDC",
  edt: "EDT",
  edp: "EDP",
  parfum: "Parfum",
  extrait: "Extrait",
};

function RatingBubbles({ value, count }: { value: number | null; count: number }) {
  const filled = Math.round(value ?? 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i < filled ? "bg-gold" : "bg-gold/20"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {value?.toFixed(1) ?? "—"}/10
        {count > 0 && ` (${count.toLocaleString()})`}
      </span>
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Full-text search first
      const { data: ftsResults } = await supabase
        .from("fragrances")
        .select("*")
        .textSearch("searchable_text", q, { type: "websearch" })
        .order("rating_count", { ascending: false })
        .limit(20);

      if (ftsResults && ftsResults.length > 0) {
        setResults(ftsResults);
      } else {
        // Fallback: ilike search on brand/perfume
        const { data: fallbackResults } = await supabase
          .from("fragrances")
          .select("*")
          .or(`brand.ilike.%${q}%,perfume.ilike.%${q}%`)
          .order("rating_count", { ascending: false })
          .limit(20);

        setResults(fallbackResults ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`, {
      scroll: false,
    });
    search(query);
  };

  return (
    <main className="min-h-screen bg-ivory">
      <SiteHeader />
      {/* Search bar below header */}
      <div className="border-b border-gold/10 bg-white px-6 py-3">
        <div className="mx-auto max-w-5xl">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fragrances..."
              className="w-full rounded-lg border border-gold/20 bg-ivory px-4 py-2.5 text-warm-black transition-colors placeholder:text-text-secondary/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}
            />
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-lg border border-gold/30 bg-gold-light/20 px-5 py-4 text-sm text-warm-black">
            <strong>Setup required:</strong> Add your Supabase credentials to{" "}
            <code className="rounded bg-gold/10 px-1">apps/web/.env.local</code> to
            enable search. See{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              supabase.com
            </a>{" "}
            to create a free project.
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="py-20 text-center text-text-secondary">
            No fragrances found for &ldquo;{initialQuery}&rdquo;
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-6 text-sm text-text-secondary">
              {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{initialQuery}&rdquo;
            </p>
            <div className="grid gap-4">
              {results.map((frag, i) => (
                <motion.div
                  key={frag.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link
                    href={`/fragrance/${frag.id}`}
                    className="group flex items-start gap-4 rounded-lg border border-gold/10 bg-white p-5 transition-all hover:border-gold/30 hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                          {frag.brand}
                        </span>
                        {frag.market_segment && (
                          <Badge
                            variant="outline"
                            className="border-gold/30 text-[10px] text-gold"
                          >
                            {SEGMENT_LABELS[frag.market_segment] ??
                              frag.market_segment}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-1 font-heading text-xl font-medium text-warm-black group-hover:text-gold transition-colors">
                        {frag.perfume}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {frag.concentration && (
                          <Badge variant="secondary" className="text-xs">
                            {CONCENTRATION_LABELS[frag.concentration] ??
                              frag.concentration.toUpperCase()}
                          </Badge>
                        )}
                        {frag.gender && (
                          <span className="text-xs capitalize text-text-secondary">
                            {frag.gender}
                          </span>
                        )}
                        {frag.year && (
                          <span className="text-xs text-text-secondary">
                            {frag.year}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <RatingBubbles
                          value={frag.rating_value}
                          count={frag.rating_count}
                        />
                      </div>
                    </div>

                    {frag.price_estimate_aud && (
                      <div className="text-right">
                        <p className="text-lg font-medium text-warm-black">
                          ~${frag.price_estimate_aud.toFixed(0)}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          Estimated AUD
                        </p>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!searched && !loading && (
          <p className="py-20 text-center text-text-secondary">
            Enter a search query to discover fragrances.
          </p>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
