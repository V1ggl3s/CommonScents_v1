"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import type { Fragrance } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlurFade } from "@/components/ui/blur-fade";
import { SiteHeader } from "@/components/site-header";

const SEGMENT_LABELS: Record<string, string> = {
  high_end_niche: "Niche",
  designer: "Designer",
  middle_eastern: "Middle Eastern",
  mid_tier: "Mid Tier",
  other: "Other",
};

const CONCENTRATION_LABELS: Record<string, string> = {
  cologne: "Eau de Cologne",
  edt: "Eau de Toilette",
  edp: "Eau de Parfum",
  parfum: "Parfum",
  extrait: "Extrait",
};

const SEASON_EMOJI: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  fall: "🍂",
  winter: "❄️",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoteTag({ note, delay }: { note: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-full border border-gold/20 bg-gold-light/20 px-3 py-1 text-sm text-warm-black"
    >
      {note}
    </motion.span>
  );
}

function AggregateRating({ value, count }: { value: number | null; count: number }) {
  const filled = Math.round(value ?? 0);
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border transition-all ${
              i < filled ? "border-gold bg-gold shadow-sm shadow-gold/30" : "border-gold/30 bg-transparent"
            }`}
          />
        ))}
      </div>
      <span className="text-lg font-medium text-warm-black">
        {value?.toFixed(1) ?? "—"}
        <span className="text-sm font-normal text-text-secondary">
          /10 from {count.toLocaleString()} rating{count !== 1 ? "s" : ""}
        </span>
      </span>
    </div>
  );
}

// ─── User rating input ────────────────────────────────────────────────────────

function UserRatingInput({ fragranceId, userId }: { fragranceId: string; userId: string | null }) {
  const router = useRouter();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_ratings")
      .select("rating")
      .eq("user_id", userId)
      .eq("fragrance_id", fragranceId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserRating(data.rating);
      });
  }, [userId, fragranceId]);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!userId) {
        router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setSaving(true);
      const { error } = await supabase
        .from("user_ratings")
        .upsert({ user_id: userId, fragrance_id: fragranceId, rating }, { onConflict: "user_id,fragrance_id" });
      if (!error) setUserRating(rating);
      setSaving(false);
    },
    [userId, fragranceId, router]
  );

  const display = hoverRating ?? userRating ?? 0;

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">
        Your Rating
      </h3>
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                disabled={saving}
                onClick={() => handleRate(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(null)}
                className={`h-5 w-5 rounded-full border transition-all cursor-pointer ${
                  n <= display
                    ? "border-gold bg-gold shadow-sm shadow-gold/30 scale-110"
                    : "border-gold/30 bg-transparent hover:border-gold/60"
                }`}
                aria-label={`Rate ${n}`}
              />
            );
          })}
        </div>
        {userRating && (
          <span className="text-sm text-gold">{userRating}/10</span>
        )}
        {!userId && (
          <span className="text-xs text-text-secondary">Sign in to rate</span>
        )}
      </div>
    </div>
  );
}

// ─── Wishlist toggle ──────────────────────────────────────────────────────────

function WishlistButton({ fragranceId, userId }: { fragranceId: string; userId: string | null }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      // Get or lazily create the user's wishlist
      let { data: wl } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!wl) {
        const { data: newWl } = await supabase
          .from("wishlists")
          .insert({ user_id: userId })
          .select("id")
          .single();
        wl = newWl;
      }
      if (wl) {
        setWishlistId(wl.id);
        const { data: items } = await supabase
          .from("wishlist_items")
          .select("id")
          .eq("wishlist_id", wl.id)
          .eq("fragrance_id", fragranceId)
          .maybeSingle();
        setWishlisted(!!items);
      }
      setLoading(false);
    })();
  }, [userId, fragranceId]);

  const toggle = async () => {
    if (!userId) {
      router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!wishlistId) return;
    if (wishlisted) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("wishlist_id", wishlistId)
        .eq("fragrance_id", fragranceId);
      setWishlisted(false);
    } else {
      await supabase
        .from("wishlist_items")
        .insert({ wishlist_id: wishlistId, fragrance_id: fragranceId });
      setWishlisted(true);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-gold/20 bg-white px-4 py-2.5 text-sm transition-all hover:border-gold/40 hover:shadow-md active:scale-[0.97] disabled:opacity-40"
      style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
    >
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={wishlisted ? "#b89a5a" : "none"}
        stroke="#b89a5a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ scale: wishlisted ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </motion.svg>
      <span className={wishlisted ? "text-gold" : "text-text-secondary"}>
        {wishlisted ? "Wishlisted" : "Add to Wishlist"}
      </span>
    </button>
  );
}

// ─── Collection picker ────────────────────────────────────────────────────────

type Collection = { id: string; name: string; has_item: boolean };

function CollectionPicker({ fragranceId, userId }: { fragranceId: string; userId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCollections = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: cols } = await supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (cols) {
      const withStatus = await Promise.all(
        cols.map(async (c) => {
          const { data: item } = await supabase
            .from("collection_items")
            .select("id")
            .eq("collection_id", c.id)
            .eq("fragrance_id", fragranceId)
            .maybeSingle();
          return { ...c, has_item: !!item };
        })
      );
      setCollections(withStatus);
    }
    setLoading(false);
  }, [userId, fragranceId]);

  const handleOpen = () => {
    if (!userId) {
      router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen(true);
    loadCollections();
  };

  const toggleItem = async (collectionId: string, hasItem: boolean) => {
    if (hasItem) {
      await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("fragrance_id", fragranceId);
    } else {
      await supabase
        .from("collection_items")
        .insert({ collection_id: collectionId, fragrance_id: fragranceId });
    }
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, has_item: !hasItem } : c))
    );
  };

  const createCollection = async () => {
    if (!userId || !newName.trim()) return;
    setCreating(true);
    const { data } = await supabase
      .from("collections")
      .insert({ user_id: userId, name: newName.trim() })
      .select("id, name")
      .single();
    if (data) {
      // Auto-add the current fragrance
      await supabase
        .from("collection_items")
        .insert({ collection_id: data.id, fragrance_id: fragranceId });
      setCollections((prev) => [...prev, { ...data, has_item: true }]);
      setNewName("");
    }
    setCreating(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl border border-gold/20 bg-white px-4 py-2.5 text-sm transition-all hover:border-gold/40 hover:shadow-md active:scale-[0.97]"
        style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b89a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <line x1="17.5" y1="14" x2="17.5" y2="21" />
          <line x1="14" y1="17.5" x2="21" y2="17.5" />
        </svg>
        <span className="text-text-secondary">Add to Collection</span>
      </button>

      {/* Collection picker sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl border-t border-gold/15 bg-ivory p-6 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
            >
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-warm-black"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.3rem", fontWeight: 500 }}
                >
                  Add to Collection
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-text-secondary hover:text-warm-black transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                  {collections.length === 0 && (
                    <p className="py-4 text-center text-sm text-text-secondary">
                      No collections yet. Create one below.
                    </p>
                  )}
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleItem(c.id, c.has_item)}
                      className="flex w-full items-center gap-3 rounded-xl border border-gold/10 bg-white px-4 py-3 text-left transition-all hover:border-gold/30 hover:shadow-sm"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                          c.has_item ? "border-gold bg-gold" : "border-gold/30"
                        }`}
                      >
                        {c.has_item && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-warm-black"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.02rem" }}
                      >
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Create new collection */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New collection name..."
                  className="flex-1 rounded-xl border border-gold/20 bg-white px-3 py-2.5 text-warm-black transition-all placeholder:text-text-secondary/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.95rem" }}
                  onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
                />
                <button
                  onClick={createCollection}
                  disabled={creating || !newName.trim()}
                  className="rounded-xl bg-gold px-4 py-2.5 text-warm-charcoal transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
                  style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FragranceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useUser();
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("fragrances")
        .select("*")
        .eq("id", id)
        .single();
      setFragrance(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!fragrance) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory gap-4">
        <p className="text-text-secondary">Fragrance not found.</p>
        <Link href="/" className="text-gold underline underline-offset-4">Go home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ivory">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Hero */}
        <BlurFade delay={0.05} inView>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">
              {fragrance.brand}
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium text-warm-black sm:text-5xl">
              {fragrance.perfume}
            </h1>
          </div>
        </BlurFade>

        {/* Metadata row */}
        <BlurFade delay={0.15} inView>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {fragrance.concentration && (
              <Badge variant="outline" className="border-gold/40 text-gold">
                {CONCENTRATION_LABELS[fragrance.concentration] ?? fragrance.concentration}
              </Badge>
            )}
            {fragrance.gender && (
              <Badge variant="secondary" className="capitalize">{fragrance.gender}</Badge>
            )}
            {fragrance.year && <Badge variant="secondary">{fragrance.year}</Badge>}
            {fragrance.market_segment && (
              <Badge variant="outline" className="border-gold/40 text-gold">
                {SEGMENT_LABELS[fragrance.market_segment]}
              </Badge>
            )}
          </div>
        </BlurFade>

        {/* Price */}
        {fragrance.price_estimate_aud && (
          <BlurFade delay={0.2} inView>
            <div className="mt-6 inline-block rounded-lg border border-gold/20 bg-white px-5 py-3">
              <p className="text-2xl font-medium text-warm-black">
                ~AUD ${fragrance.price_estimate_aud.toFixed(0)}
              </p>
              <p className="text-xs text-text-secondary">Estimated</p>
            </div>
          </BlurFade>
        )}

        {/* Aggregate rating */}
        <BlurFade delay={0.25} inView>
          <div className="mt-8">
            <AggregateRating value={fragrance.rating_value} count={fragrance.rating_count} />
          </div>
        </BlurFade>

        {/* User rating + wishlist + collection actions */}
        <BlurFade delay={0.28} inView>
          <UserRatingInput fragranceId={id} userId={user?.id ?? null} />
          <div className="mt-5 flex flex-wrap gap-3">
            <WishlistButton fragranceId={id} userId={user?.id ?? null} />
            <CollectionPicker fragranceId={id} userId={user?.id ?? null} />
          </div>
        </BlurFade>

        <Separator className="my-8 bg-gold/10" />

        {/* Notes */}
        <BlurFade delay={0.3} inView>
          <div className="space-y-6">
            {fragrance.top_notes.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Top Notes</h3>
                <div className="flex flex-wrap gap-2">
                  {fragrance.top_notes.map((note, i) => <NoteTag key={note} note={note} delay={0.02 * i} />)}
                </div>
              </div>
            )}
            {fragrance.middle_notes.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Middle Notes</h3>
                <div className="flex flex-wrap gap-2">
                  {fragrance.middle_notes.map((note, i) => <NoteTag key={note} note={note} delay={0.02 * i} />)}
                </div>
              </div>
            )}
            {fragrance.base_notes.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Base Notes</h3>
                <div className="flex flex-wrap gap-2">
                  {fragrance.base_notes.map((note, i) => <NoteTag key={note} note={note} delay={0.02 * i} />)}
                </div>
              </div>
            )}
          </div>
        </BlurFade>

        {/* Accords */}
        {fragrance.main_accords.length > 0 && (
          <>
            <Separator className="my-8 bg-gold/10" />
            <BlurFade delay={0.35} inView>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Main Accords</h3>
                <div className="flex flex-wrap gap-2">
                  {fragrance.main_accords.map((accord) => (
                    <span key={accord} className="rounded-full border border-gold/40 bg-gold-light/30 px-4 py-1.5 text-sm font-medium text-gold">
                      {accord}
                    </span>
                  ))}
                </div>
              </div>
            </BlurFade>
          </>
        )}

        {/* Time & Season */}
        {(fragrance.best_time.length > 0 || fragrance.best_season.length > 0) && (
          <>
            <Separator className="my-8 bg-gold/10" />
            <BlurFade delay={0.4} inView>
              <div className="flex flex-wrap gap-8">
                {fragrance.best_time.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Best Time</h3>
                    <div className="flex gap-2">
                      {fragrance.best_time.map((t) => (
                        <Badge key={t} variant="outline" className="border-gold/30 capitalize">
                          {t === "day" ? "☀️" : "🌙"} {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {fragrance.best_season.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Best Season</h3>
                    <div className="flex gap-2">
                      {fragrance.best_season.map((s) => (
                        <Badge key={s} variant="outline" className="border-gold/30 capitalize">
                          {SEASON_EMOJI[s] ?? ""} {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </BlurFade>
          </>
        )}

        {/* Perfumer */}
        {fragrance.perfumer && (
          <>
            <Separator className="my-8 bg-gold/10" />
            <BlurFade delay={0.45} inView>
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">Perfumer</h3>
                <p className="text-warm-black">{fragrance.perfumer}</p>
              </div>
            </BlurFade>
          </>
        )}

        {/* External link */}
        {fragrance.fragrantica_url && (
          <>
            <Separator className="my-8 bg-gold/10" />
            <a
              href={fragrance.fragrantica_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold underline underline-offset-4 hover:text-gold/80"
            >
              View on Fragrantica &rarr;
            </a>
          </>
        )}
      </div>
    </main>
  );
}
