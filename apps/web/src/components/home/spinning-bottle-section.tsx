"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ─── Concentration data ───────────────────────────────────────────────────────
const CONCENTRATIONS = [
  {
    id: "cologne"  as const,
    label: "Cologne",
    abbr: "EDC",
    pct: "2 – 4% fragrance oils",
    tagline: "Airy, light, everyday wear",
    liquidLevel: 0.16,
    liquidColor: "#d4aa70",
  },
  {
    id: "edt" as const,
    label: "Eau de Toilette",
    abbr: "EDT",
    pct: "8 – 12% fragrance oils",
    tagline: "Fresh, moderate, daytime",
    liquidLevel: 0.38,
    liquidColor: "#c4965f",
  },
  {
    id: "edp" as const,
    label: "Eau de Parfum",
    abbr: "EDP",
    pct: "15 – 20% fragrance oils",
    tagline: "Rich, full, evening presence",
    liquidLevel: 0.62,
    liquidColor: "#b07840",
  },
  {
    id: "parfum" as const,
    label: "Parfum",
    abbr: "Extrait",
    pct: "20 – 30% fragrance oils",
    tagline: "Intense, long-lasting luxury",
    liquidLevel: 0.84,
    liquidColor: "#8c5a28",
  },
] as const;

type ConcId = (typeof CONCENTRATIONS)[number]["id"];

// ─── Note layer data ──────────────────────────────────────────────────────────
const NOTE_LAYERS = [
  {
    label: "Top Notes",
    description: "The first impression. Light and bright, gone within 30 minutes.",
    examples: ["Lemon", "Bergamot", "Pink Pepper"],
    accentColor: "from-amber-300/20 to-yellow-200/10",
    borderColor: "border-amber-400/40",
    tagBg: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  },
  {
    label: "Middle Notes",
    description: "The heart of the fragrance. What it truly is — blooms over the first hour.",
    examples: ["Rose", "Jasmine", "Lavender"],
    accentColor: "from-rose-400/20 to-pink-300/10",
    borderColor: "border-rose-400/40",
    tagBg: "bg-rose-400/15 text-rose-200 border-rose-400/30",
  },
  {
    label: "Base Notes",
    description: "The lasting memory. Deep and warm, anchoring the scent for hours.",
    examples: ["Sandalwood", "Amber", "Musk"],
    accentColor: "from-orange-500/20 to-amber-700/10",
    borderColor: "border-orange-500/40",
    tagBg: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  },
];

// ─── SVG bottle dimensions ────────────────────────────────────────────────────
const BODY_TOP    = 108;
const BODY_BOTTOM = 384;
const BODY_HEIGHT = BODY_BOTTOM - BODY_TOP;

function liquidY(level: number) {
  return BODY_TOP + BODY_HEIGHT * (1 - level);
}

// ─── Bottle SVG ───────────────────────────────────────────────────────────────
function BottleSVG({ level, color }: { level: number; color: string }) {
  const ly = liquidY(level);

  return (
    <svg
      viewBox="0 0 200 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.55)) drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
    >
      <defs>
        {/* Interior clip — neck + body */}
        <clipPath id="cs-bottle-clip">
          <path d="M 72,58 L 72,102 Q 10,106 10,116 L 10,374 Q 10,384 20,384 L 180,384 Q 190,384 190,374 L 190,116 Q 190,106 128,102 L 128,58 Z" />
        </clipPath>

        {/* Liquid horizontal gradient */}
        <linearGradient id="cs-liquid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.75" />
          <stop offset="45%"  stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.70" />
        </linearGradient>

        {/* Glass body gradient */}
        <linearGradient id="cs-glass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgb(200,218,238)" stopOpacity="0.20" />
          <stop offset="50%"  stopColor="rgb(210,228,248)" stopOpacity="0.09" />
          <stop offset="100%" stopColor="rgb(200,218,238)" stopOpacity="0.17" />
        </linearGradient>

        {/* Left edge glass highlight */}
        <linearGradient id="cs-left-hl" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0.00" />
        </linearGradient>

        {/* Cap gradient */}
        <linearGradient id="cs-cap" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#e2c472" />
          <stop offset="40%"  stopColor="#b89a5a" />
          <stop offset="100%" stopColor="#7a5828" />
        </linearGradient>
      </defs>

      {/* ── Glass structure (behind liquid) ── */}
      {/* Neck */}
      <rect x="72" y="58" width="56" height="46" rx="3"
        fill="url(#cs-glass)" stroke="rgba(255,255,255,0.20)" strokeWidth="1" />
      {/* Shoulder */}
      <path d="M 10,116 Q 10,102 72,102 L 128,102 Q 190,102 190,116"
        fill="url(#cs-glass)" stroke="rgba(255,255,255,0.20)" strokeWidth="1" />
      {/* Body */}
      <rect x="10" y="114" width="180" height="270" rx="10"
        fill="url(#cs-glass)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

      {/* ── Liquid (clipped to bottle interior) ── */}
      <g clipPath="url(#cs-bottle-clip)">
        {/* Liquid fill — spring-animates to new level on hover */}
        <motion.rect
          x="10" width="180" height="400"
          fill="url(#cs-liquid)"
          animate={{ y: ly }}
          transition={{ type: "spring", stiffness: 55, damping: 16 }}
        />

        {/* Wave group — tracks liquid top then scrolls horizontally */}
        <motion.g
          animate={{ y: ly - 14 }}
          transition={{ type: "spring", stiffness: 55, damping: 16 }}
        >
          <motion.g
            animate={{ x: [0, -200] }}
            transition={{ duration: 3.5, ease: "linear", repeat: Infinity }}
          >
            {/* Wave path wider than bottle so tile seam never shows */}
            <path
              d="M -200,8 C -150,18 -100,-2 -50,8 C 0,18 50,-2 100,8 C 150,18 200,-2 250,8 C 300,18 350,-2 400,8 L 400,32 L -200,32 Z"
              fill={color}
              fillOpacity="0.55"
            />
          </motion.g>
        </motion.g>
      </g>

      {/* ── Glass highlights (rendered over liquid) ── */}
      {/* Left edge highlight */}
      <rect x="10" y="114" width="14" height="270" rx="7"
        fill="url(#cs-left-hl)" />
      {/* Right edge faint glint */}
      <rect x="176" y="114" width="14" height="270" rx="7"
        fill="white" fillOpacity="0.05" />
      {/* Neck left highlight */}
      <rect x="72" y="58" width="8" height="46" rx="4"
        fill="white" fillOpacity="0.12" />
      {/* Thin centre reflection streak */}
      <rect x="96" y="126" width="3" height="210" rx="1.5"
        fill="white" fillOpacity="0.04" />

      {/* ── Cap ── */}
      <rect x="48" y="8" width="104" height="48" rx="6"
        fill="url(#cs-cap)" />
      {/* Cap facet dividing line */}
      <rect x="48" y="32" width="104" height="2.5"
        fill="rgba(0,0,0,0.18)" />
      {/* Cap top highlight */}
      <rect x="54" y="12" width="92" height="14" rx="5"
        fill="white" fillOpacity="0.17" />
      {/* Cap-to-neck collar ring */}
      <rect x="58" y="54" width="84" height="8" rx="3"
        fill="#7a5828" />
      {/* Collar highlight */}
      <rect x="62" y="55" width="76" height="3" rx="1.5"
        fill="rgba(255,255,255,0.14)" />

      {/* ── Bottle outline stroke (over everything for crispness) ── */}
      <path
        d="M 72,58 L 72,102 Q 10,106 10,116 L 10,374 Q 10,384 20,384 L 180,384 Q 190,384 190,374 L 190,116 Q 190,106 128,102 L 128,58"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none"
      />
    </svg>
  );
}

// ─── Concentration card (left column) ────────────────────────────────────────
function ConcentrationCard({
  conc,
  isActive,
  onMouseEnter,
  onMouseLeave,
}: {
  conc: (typeof CONCENTRATIONS)[number];
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      animate={{
        boxShadow: isActive
          ? "0 0 24px rgba(184,154,90,0.38), 0 0 8px rgba(184,154,90,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 0px rgba(184,154,90,0)",
        borderColor: isActive ? "rgba(184,154,90,0.55)" : "rgba(184,154,90,0.14)",
        backgroundColor: isActive ? "rgba(184,154,90,0.07)" : "rgba(28,22,16,0.5)",
      }}
      transition={{ duration: 0.28 }}
      className="w-full rounded-2xl border border-gold/14 bg-warm-charcoal/50 p-4 cursor-default backdrop-blur-sm"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="text-ivory font-medium leading-snug"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.08rem" }}
        >
          {conc.label}
        </span>
        <span
          className="flex-shrink-0 text-gold/55 uppercase"
          style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em" }}
        >
          {conc.abbr}
        </span>
      </div>
      <p
        className="mt-1 text-gold/65 uppercase"
        style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em" }}
      >
        {conc.pct}
      </p>
      <p
        className="mt-1.5 text-ivory/45 italic"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem" }}
      >
        {conc.tagline}
      </p>
    </motion.div>
  );
}

// ─── Note card (right column) ─────────────────────────────────────────────────
function NoteCard({ layer }: { layer: (typeof NOTE_LAYERS)[number] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        boxShadow: hovered
          ? "0 0 28px rgba(184,154,90,0.42), 0 0 10px rgba(184,154,90,0.18)"
          : "0 0 0px rgba(184,154,90,0)",
      }}
      transition={{ duration: 0.28 }}
      className={`w-full rounded-2xl border ${layer.borderColor} bg-gradient-to-br ${layer.accentColor} p-5 backdrop-blur-sm cursor-default`}
    >
      <h3
        className="font-medium text-gold"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem" }}
      >
        {layer.label}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory/65">
        {layer.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {layer.examples.map((ex) => (
          <span key={ex} className={`rounded-full border px-2.5 py-0.5 text-xs ${layer.tagBg}`}>
            {ex}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export function SpinningBottleSection() {
  const [activeConc, setActiveConc] = useState<ConcId | null>(null);

  const current     = CONCENTRATIONS.find((c) => c.id === activeConc);
  const level       = current?.liquidLevel ?? 0.50;
  const color       = current?.liquidColor ?? "#c4965f";

  return (
    <section className="relative bg-warm-charcoal py-24 sm:py-32 overflow-hidden">
      {/* Anatomy background image — very subtle */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/anatomy/BG_1.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
        style={{
          opacity: 0.3,
          filter: "saturate(0.4) brightness(0.7)",
          mixBlendMode: "normal",
        }}
      />
      {/* Dark overlay to keep text crisp */}
      <div className="absolute inset-0 bg-warm-charcoal/55 pointer-events-none" />
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(184,150,90,0.06),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <h2
            className="font-light text-ivory"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}
          >
            The Anatomy of a Fragrance
          </h2>
          <p
            className="mt-3 text-ivory/35 uppercase"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.28em" }}
          >
            Hover a concentration to see its depth
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 lg:gap-10">

          {/* Left — Concentration cards */}
          <div className="flex flex-col gap-3">
            {CONCENTRATIONS.map((conc) => (
              <ConcentrationCard
                key={conc.id}
                conc={conc}
                isActive={activeConc === conc.id}
                onMouseEnter={() => setActiveConc(conc.id)}
                onMouseLeave={() => setActiveConc(null)}
              />
            ))}
          </div>

          {/* Centre — SVG bottle */}
          <div className="w-36 sm:w-44 md:w-52 flex-shrink-0">
            <BottleSVG level={level} color={color} />
          </div>

          {/* Right — Note cards */}
          <div className="flex flex-col gap-3">
            {NOTE_LAYERS.map((layer) => (
              <NoteCard key={layer.label} layer={layer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
