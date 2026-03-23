"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { CommonScentsMotif } from "@/components/logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// ─── Hue palette — one per rotating word ─────────────────────────────────────
const WORD_HUES = [
  { gold: "#b89a5a", glow: "rgba(184,154,90,0.22)" },   // Discover
  { gold: "#c4965f", glow: "rgba(196,150,95,0.22)" },   // Understand
  { gold: "#a09060", glow: "rgba(160,144,96,0.22)" },   // Curate
  { gold: "#ba8a4a", glow: "rgba(186,138,74,0.22)" },   // Collect
];

const WORD_INTERVAL = 4000;

// ─── Background ingredient images (from public/backgrounds) ─────────────────
// Spaces in filenames are encoded for URL safety
const BG_IMAGES = [
  "/backgrounds/spices.jpg",
  "/backgrounds/pink rose.jpg",
  "/backgrounds/amber.jpg",
  "/backgrounds/orchids.jpg",
  "/backgrounds/cedar.webp",
  "/backgrounds/tobacco.jpeg",
  "/backgrounds/neroli.jpg",
  "/backgrounds/lavender.jpeg",
  "/backgrounds/bergamot.jpg",
  "/backgrounds/pepper.webp",
  "/backgrounds/vetiver.jpg",
  "/backgrounds/labdanum.jpg",
  "/backgrounds/aquatic.jpg",
  "/backgrounds/mhyrr.jpg",
  "/backgrounds/grapefruit.jpg",
  "/backgrounds/vanilla and spice.jpg",
];

// ─── Gold floating particles ──────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  size: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 14,
  duration: 10 + Math.random() * 14,
  drift: `${-30 + Math.random() * 60}px`,
}));

// ─── Botanical SVG overlay (very faint) ──────────────────────────────────────
function BotanicalOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Rose petal silhouettes — top-left cluster */}
      <g transform="translate(60, 80)" opacity="0.04" fill="#b89a5a">
        <ellipse cx="0" cy="0" rx="22" ry="38" transform="rotate(-30)" />
        <ellipse cx="28" cy="-10" rx="18" ry="32" transform="rotate(10)" />
        <ellipse cx="-18" cy="20" rx="16" ry="28" transform="rotate(-70)" />
        <ellipse cx="10" cy="32" rx="14" ry="26" transform="rotate(50)" />
      </g>
      {/* Leaf — bottom-right */}
      <g transform="translate(88%, 78%)" opacity="0.035" fill="#b89a5a">
        <ellipse cx="0" cy="0" rx="20" ry="45" transform="rotate(20)" />
        <ellipse cx="-14" cy="8" rx="14" ry="32" transform="rotate(-15)" />
        <ellipse cx="18" cy="-5" rx="12" ry="28" transform="rotate(45)" />
      </g>
      {/* Single stem line */}
      <line x1="7%" y1="100%" x2="12%" y2="60%" stroke="#b89a5a" strokeWidth="0.5" opacity="0.05" />
      <line x1="93%" y1="100%" x2="89%" y2="55%" stroke="#b89a5a" strokeWidth="0.5" opacity="0.05" />
    </svg>
  );
}

export function HeroSection() {
  const titles = useMemo(() => ["Discover", "Understand", "Curate", "Collect"], []);
  const [titleNumber, setTitleNumber] = useState(0);
  const [hue, setHue] = useState(WORD_HUES[0]);
  // Two fixed image slots — we never re-key them, only swap src/opacity
  const [slotA, setSlotA] = useState({ src: BG_IMAGES[0], opacity: 0.22 });
  const [slotB, setSlotB] = useState({ src: BG_IMAGES[1], opacity: 0 });
  const activeSlot   = useRef<"A" | "B">("A");
  const nextImgIdx   = useRef(2);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  type Suggestion = { id: string; brand: string | null; perfume: string | null; concentration: string | null; rating_value: number | null };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Parallax on scroll
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const logoY   = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const heroY   = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const searchY = useTransform(scrollYProgress, [0, 1], ["0%", "-4%"]);

  // Cycle word + hue
  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = (titleNumber + 1) % titles.length;
      setTitleNumber(next);
      setHue(WORD_HUES[next]);
    }, WORD_INTERVAL);
    return () => clearTimeout(timeout);
  }, [titleNumber, titles]);

  // Two-slot cross-fade: never re-key either <img>; only touch src of the hidden slot
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSlot.current === "A") {
        // A is visible → fade B in, A out
        setSlotB((s) => ({ ...s, opacity: 0.22 }));
        setSlotA((s) => ({ ...s, opacity: 0 }));
        // After CSS transition completes, silently update A's src while it's hidden
        setTimeout(() => {
          setSlotA((s) => ({ ...s, src: BG_IMAGES[nextImgIdx.current % BG_IMAGES.length] }));
          nextImgIdx.current = (nextImgIdx.current + 1) % BG_IMAGES.length;
          activeSlot.current = "B";
        }, 2200);
      } else {
        // B is visible → fade A in, B out
        setSlotA((s) => ({ ...s, opacity: 0.22 }));
        setSlotB((s) => ({ ...s, opacity: 0 }));
        setTimeout(() => {
          setSlotB((s) => ({ ...s, src: BG_IMAGES[nextImgIdx.current % BG_IMAGES.length] }));
          nextImgIdx.current = (nextImgIdx.current + 1) % BG_IMAGES.length;
          activeSlot.current = "A";
        }, 2200);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Live suggestion search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      if (!isSupabaseConfigured) return;
      setLoadingSuggestions(true);
      try {
        const { data } = await supabase
          .from("fragrances")
          .select("id, brand, perfume, concentration, rating_value")
          .or(`brand.ilike.%${query}%,perfume.ilike.%${query}%`)
          .order("rating_count", { ascending: false })
          .limit(5);
        setSuggestions(data ?? []);
        setShowDropdown((data?.length ?? 0) > 0);
      } catch { setSuggestions([]); }
      finally { setLoadingSuggestions(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current?.contains(e.target as Node) === false &&
          inputRef.current?.contains(e.target as Node) === false) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { setShowDropdown(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }
  }, [query, router]);

  const handleSelectSuggestion = useCallback((id: string) => {
    setShowDropdown(false);
    router.push(`/fragrance/${id}`);
  }, [router]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center bg-warm-charcoal px-6 overflow-hidden"
    >
      {/* ── Rotating ingredient background — two stable slots, no remounting ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Slot A — src changes only while opacity === 0, so no visible flash */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slotA.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: slotA.opacity,
            transition: "opacity 2s ease",
            filter: "saturate(0.35) brightness(0.55)",
          }}
        />
        {/* Slot B — same principle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slotB.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: slotB.opacity,
            transition: "opacity 2s ease",
            filter: "saturate(0.35) brightness(0.55)",
          }}
        />
        {/* Dark overlay so images never compete with text */}
        <div className="absolute inset-0 bg-warm-charcoal/65" />
      </div>

      {/* ── Film grain texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
          opacity: 0.55,
          mixBlendMode: "overlay",
        }}
      />

      {/* ── Botanical outline overlay ── */}
      <BotanicalOverlay />

      {/* ── Hue-shifting radial glow ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 70% 55% at 50% 30%, ${hue.glow}, transparent 70%)` }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />

      {/* ── Vignette — darker corners, brighter centre ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(12,9,7,0.7) 100%)" }}
      />

      {/* ── Floating gold particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-gold"
            style={{
              left: p.left,
              bottom: "-4px",
              width: p.size,
              height: p.size,
              opacity: 0,
              ["--drift" as string]: p.drift,
              animation: `float-particle ${p.duration}s ${p.delay}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Logo with parallax ── */}
      <motion.div
        style={{ y: logoY }}
        className="relative z-10 flex w-full flex-col items-center justify-center pt-14 pb-0"
      >
        <CommonScentsMotif size="md" animateIn />
      </motion.div>

      {/* ── Main content with parallax ── */}
      <motion.div
        style={{ y: heroY }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center pb-20 -mt-36"
      >
        {/* Rotating headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1
            className="font-heading font-light leading-[1.08] tracking-tight text-ivory"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5.5rem)" }}
          >
            <span
              className="relative flex w-full justify-center overflow-visible pb-2 pt-1"
              style={{ minHeight: "1.2em" }}
            >
              &nbsp;
              <AnimatePresence mode="wait">
                <motion.span
                  key={titleNumber}
                  className="absolute font-medium"
                  style={{ color: hue.gold, textShadow: `0 0 80px ${hue.glow}, 0 0 30px ${hue.glow}` }}
                  initial={{ opacity: 0, y: 50, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -40, filter: "blur(3px)" }}
                  transition={{ type: "spring", stiffness: 55, damping: 18, duration: 0.9 }}
                >
                  {titles[titleNumber]}
                </motion.span>
              </AnimatePresence>
            </span>
            the scents that define you.
          </h1>
        </motion.div>

        {/* ── Search bar with parallax + enhanced glow + decorative rules ── */}
        <motion.div
          style={{ y: searchY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="mt-10 w-full max-w-2xl sm:mt-12"
        >
          {/* Decorative top rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1.1 }}
            className="mb-5 h-px w-full origin-center"
            style={{ background: `linear-gradient(90deg, transparent, ${hue.gold}50, transparent)`, transition: "background 1.5s ease" }}
          />

          <form onSubmit={handleSearch} className="relative">
            {/* Ambient glow behind the search bar */}
            <motion.div
              animate={{
                boxShadow: isFocused
                  ? `0 0 60px ${hue.glow}, 0 0 120px rgba(184,154,90,0.08), 0 8px 32px rgba(0,0,0,0.4)`
                  : `0 0 30px ${hue.glow.replace("0.22", "0.1")}, 0 4px 20px rgba(0,0,0,0.3)`,
              }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setIsFocused(true); if (suggestions.length > 0) setShowDropdown(true); }}
                onBlur={() => setIsFocused(false)}
                placeholder="Search 70,000+ fragrances..."
                className="w-full rounded-2xl bg-warm-charcoal/70 py-4 pl-5 pr-28 text-lg text-ivory shadow-inner backdrop-blur-md transition-all duration-300 placeholder:text-ivory/30 focus:outline-none sm:py-5"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.15rem",
                  letterSpacing: "0.02em",
                  border: `1px solid ${isFocused ? hue.gold + "70" : "rgba(184,154,90,0.22)"}`,
                  transition: "border-color 0.5s ease",
                }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-5 py-2.5 text-sm font-medium text-warm-charcoal transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                style={{ background: hue.gold, transition: "background 1.5s ease, box-shadow 0.2s" }}
              >
                Search
              </button>
            </motion.div>

            {/* Live dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gold/20 bg-warm-charcoal/95 shadow-2xl shadow-black/50 backdrop-blur-md z-50 overflow-hidden"
                  style={{ transformOrigin: "top" }}
                >
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      {/* Scrollable list — capped height, scroll trapped inside */}
                      <ul
                        className="overflow-y-auto"
                        style={{
                          maxHeight: "min(220px, 28vh)",
                          overscrollBehavior: "contain",
                        }}
                      >
                        {suggestions.map((frag, i) => (
                          <li key={frag.id}>
                            <button
                              type="button"
                              onMouseDown={() => handleSelectSuggestion(frag.id)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gold/10 group"
                              style={{ borderTop: i > 0 ? "1px solid rgba(184,154,90,0.1)" : "none" }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-ivory/60 group-hover:text-ivory/80 transition-colors"
                                  style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                                  {frag.brand}
                                </p>
                                <p className="truncate text-ivory group-hover:text-gold transition-colors"
                                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem", fontWeight: 400 }}>
                                  {frag.perfume}
                                </p>
                              </div>
                              {frag.rating_value && (
                                <span className="flex-shrink-0 text-gold/60"
                                  style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                                  {frag.rating_value.toFixed(1)}/10
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {/* "See all" footer — always visible, pinned outside the scroll area */}
                      <div style={{ borderTop: "1px solid rgba(184,154,90,0.1)" }}>
                        <button type="submit"
                          className="w-full px-5 py-3 text-center transition-colors hover:bg-gold/5"
                          style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: hue.gold }}>
                          See all results{" "}for &ldquo;{query}&rdquo;
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Decorative bottom rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1.3 }}
            className="mt-5 h-px w-full origin-center"
            style={{ background: `linear-gradient(90deg, transparent, ${hue.gold}40, transparent)`, transition: "background 1.5s ease" }}
          />
        </motion.div>

        {/* ── Quick suggestion pills — enhanced hover ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.3 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {["Dior Sauvage", "Baccarat Rouge 540", "Bleu de Chanel", "Aventus"].map((suggestion) => (
            <motion.button
              key={suggestion}
              whileHover={{ scale: 1.05, boxShadow: `0 0 16px ${hue.glow}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setQuery(suggestion);
                setShowDropdown(false);
                router.push(`/search?q=${encodeURIComponent(suggestion)}`);
              }}
              className="rounded-full px-4 py-1.5 transition-colors"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.9rem",
                color: hue.gold,
                letterSpacing: "0.02em",
                border: `1px solid ${hue.gold}30`,
                background: `${hue.gold}08`,
                transition: "background 1.5s ease, border-color 1.5s ease, color 1.5s ease",
              }}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-10 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `${hue.gold}80`, transition: "color 1.5s ease" }}>
            Explore
          </span>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ color: `${hue.gold}60` }}>
            <path d="M10 4L10 16M10 16L5 11M10 16L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
