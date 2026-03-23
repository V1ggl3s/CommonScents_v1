"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import type { Fragrance } from "@/lib/types";

type Tab = "collections" | "wishlist" | "ratings";

type Collection = { id: string; name: string; item_count: number };
type RatedFragrance = { fragrance: Fragrance; rating: number };

// ─── Fragrance card used across all tabs ──────────────────────────────────────

function FragranceCard({ fragrance, extra }: { fragrance: Fragrance; extra?: React.ReactNode }) {
  return (
    <Link
      href={`/fragrance/${fragrance.id}`}
      className="group flex items-start gap-4 rounded-xl border border-gold/10 bg-white p-4 transition-all hover:border-gold/30 hover:shadow-md"
    >
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-text-secondary uppercase"
          style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em" }}
        >
          {fragrance.brand}
        </p>
        <p
          className="mt-0.5 truncate text-warm-black group-hover:text-gold transition-colors"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.08rem", fontWeight: 500 }}
        >
          {fragrance.perfume}
        </p>
        {fragrance.concentration && (
          <span className="mt-1 inline-block text-xs text-text-secondary capitalize">
            {fragrance.concentration}
          </span>
        )}
      </div>
      {extra}
    </Link>
  );
}

// ─── Collections tab ──────────────────────────────────────────────────────────

function CollectionsTab({ userId }: { userId: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cols } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (cols) {
        const withCounts = await Promise.all(
          cols.map(async (c) => {
            const { count } = await supabase
              .from("collection_items")
              .select("id", { count: "exact", head: true })
              .eq("collection_id", c.id);
            return { ...c, item_count: count ?? 0 };
          })
        );
        setCollections(withCounts);
      }
      setLoading(false);
    })();
  }, [userId]);

  const toggleExpand = useCallback(async (colId: string) => {
    if (expandedId === colId) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }
    setExpandedId(colId);
    setItemsLoading(true);
    const { data: items } = await supabase
      .from("collection_items")
      .select("fragrance_id")
      .eq("collection_id", colId);

    if (items && items.length > 0) {
      const ids = items.map((i) => i.fragrance_id);
      const { data: frags } = await supabase
        .from("fragrances")
        .select("*")
        .in("id", ids);
      setExpandedItems(frags ?? []);
    } else {
      setExpandedItems([]);
    }
    setItemsLoading(false);
  }, [expandedId]);

  if (loading) return <LoadingSpinner />;

  if (collections.length === 0) {
    return <EmptyState message="No collections yet. Add fragrances to collections from their detail pages." />;
  }

  return (
    <div className="space-y-3">
      {collections.map((col) => (
        <div key={col.id}>
          <button
            onClick={() => toggleExpand(col.id)}
            className="w-full flex items-center justify-between rounded-xl border border-gold/10 bg-white px-5 py-4 text-left transition-all hover:border-gold/30 hover:shadow-sm"
          >
            <div>
              <p
                className="text-warm-black"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 500 }}
              >
                {col.name}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {col.item_count} fragrance{col.item_count !== 1 ? "s" : ""}
              </p>
            </div>
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b89a5a"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{ rotate: expandedId === col.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <polyline points="6,9 12,15 18,9" />
            </motion.svg>
          </button>

          <AnimatePresence>
            {expandedId === col.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pl-3 space-y-2">
                  {itemsLoading ? (
                    <LoadingSpinner />
                  ) : expandedItems.length === 0 ? (
                    <p className="py-3 text-sm text-text-secondary">No fragrances in this collection.</p>
                  ) : (
                    expandedItems.map((f) => <FragranceCard key={f.id} fragrance={f} />)
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── Wishlist tab ─────────────────────────────────────────────────────────────

function WishlistTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: wl } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (wl) {
        const { data: wlItems } = await supabase
          .from("wishlist_items")
          .select("fragrance_id")
          .eq("wishlist_id", wl.id);

        if (wlItems && wlItems.length > 0) {
          const ids = wlItems.map((i) => i.fragrance_id);
          const { data: frags } = await supabase
            .from("fragrances")
            .select("*")
            .in("id", ids);
          setItems(frags ?? []);
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  if (items.length === 0) {
    return <EmptyState message="Your wishlist is empty. Heart fragrances from their detail pages to add them." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((f) => <FragranceCard key={f.id} fragrance={f} />)}
    </div>
  );
}

// ─── Ratings tab ──────────────────────────────────────────────────────────────

function RatingsTab({ userId }: { userId: string }) {
  const [rated, setRated] = useState<RatedFragrance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ratings } = await supabase
        .from("user_ratings")
        .select("fragrance_id, rating")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (ratings && ratings.length > 0) {
        const ids = ratings.map((r) => r.fragrance_id);
        const { data: frags } = await supabase
          .from("fragrances")
          .select("*")
          .in("id", ids);

        if (frags) {
          const fragsMap = new Map(frags.map((f) => [f.id, f]));
          setRated(
            ratings
              .map((r) => {
                const f = fragsMap.get(r.fragrance_id);
                return f ? { fragrance: f, rating: r.rating } : null;
              })
              .filter(Boolean) as RatedFragrance[]
          );
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <LoadingSpinner />;

  if (rated.length === 0) {
    return <EmptyState message="You haven't rated any fragrances yet. Rate them from their detail pages." />;
  }

  return (
    <div className="space-y-3">
      {rated.map(({ fragrance, rating }) => (
        <FragranceCard
          key={fragrance.id}
          fragrance={fragrance}
          extra={
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <span
                className="text-gold font-medium"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.2rem" }}
              >
                {rating}
              </span>
              <span className="text-text-secondary" style={{ fontSize: "0.7rem" }}>/10</span>
            </div>
          }
        />
      ))}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b89a5a" strokeWidth="1" strokeLinecap="round" opacity="0.4">
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <p className="text-sm text-text-secondary text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "collections", label: "Collections" },
  { id: "wishlist", label: "Wishlist" },
  { id: "ratings", label: "My Ratings" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("collections");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?redirect=/profile");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  const displayName = (user.user_metadata?.name as string) || user.email || "User";

  return (
    <main className="min-h-screen bg-ivory">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Profile header */}
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-charcoal text-gold"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "0.05em" }}
          >
            {displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1
              className="text-warm-black"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.6rem", fontWeight: 500 }}
            >
              {displayName}
            </h1>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>

        {/* Gold rule */}
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg border border-gold/10 bg-gold/[0.03] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 rounded-md py-2.5 text-center transition-colors"
              style={{
                fontFamily: "'Tenor Sans', sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: activeTab === tab.id ? "#1a1612" : "rgba(58,53,48,0.45)",
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profile-tab-bg"
                  className="absolute inset-0 rounded-md bg-white shadow-sm border border-gold/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "collections" && <CollectionsTab userId={user.id} />}
              {activeTab === "wishlist" && <WishlistTab userId={user.id} />}
              {activeTab === "ratings" && <RatingsTab userId={user.id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
