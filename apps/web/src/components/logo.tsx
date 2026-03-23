"use client";

import { motion } from "framer-motion";

/**
 * Full animated CommonScents logo motif — matches the claude_icon.html design.
 * Includes: rotating rings, floating flacon, shimmer wordmark, gold rules, tagline.
 */
export function CommonScentsMotif({
  size = "md",
  className = "",
  animateIn = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  animateIn?: boolean;
}) {
  const dims = {
    sm: { wrap: 72, flacon: { w: 32, h: 39 }, brand: "text-2xl", letter: "0.18em", rule: 140 },
    md: { wrap: 110, flacon: { w: 48, h: 60 }, brand: "text-4xl", letter: "0.22em", rule: 200 },
    lg: { wrap: 140, flacon: { w: 60, h: 74 }, brand: "text-5xl", letter: "0.22em", rule: 260 },
  }[size];

  const stageAnim = animateIn
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
    : {};

  return (
    <motion.div
      {...stageAnim}
      className={`flex flex-col items-center gap-0 ${className}`}
    >
      {/* Wordmark — title and subtitle first */}
      <div className="flex flex-col items-center gap-0">
        {/* Top rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: dims.rule,
            height: 1,
            background: "linear-gradient(90deg, transparent, #b89a5a, transparent)",
            marginBottom: 18,
            transformOrigin: "center",
          }}
        />

        {/* Brand name with shimmer */}
        <div className="relative select-none">
          <span
            className="font-light leading-none text-cream"
            style={{
              fontFamily: "'Allura', cursive",
              fontStyle: "italic",
              letterSpacing: "0.02em",
              color: "#f5f0e8",
              fontSize: size === "sm" ? "2rem" : size === "md" ? "2.8rem" : "3.6rem",
            }}
          >
            CommonScents
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "'Tenor Sans', sans-serif",
            fontSize: size === "sm" ? "0.48rem" : "0.58rem",
            letterSpacing: "0.42em",
            color: "#b89a5a",
            textTransform: "uppercase",
            marginTop: 10,
            opacity: 0.85,
          }}
        >
          Discover · Curate · Collect
        </div>

        {/* Bottom rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: dims.rule,
            height: 1,
            background: "linear-gradient(90deg, transparent, #b89a5a, transparent)",
            marginTop: 14,
            transformOrigin: "center",
          }}
        />
      </div>

      {/* Icon — visual underneath title and subtitle */}
      <div
        className="relative flex items-center justify-center mt-12"
        style={{ width: dims.wrap, height: dims.wrap }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(184,154,90,0.25)" }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: -3, width: 5, height: 5, background: "#b89a5a", boxShadow: "0 0 8px #b89a5a" }}
          />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full"
          style={{ inset: Math.round(dims.wrap * 0.12), border: "1px solid rgba(184,154,90,0.15)" }}
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <svg width={dims.flacon.w} height={dims.flacon.h} viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="19" y="1" width="14" height="5" rx="1" fill="none" stroke="#b89a5a" strokeWidth="1.2" />
            <rect x="22" y="6" width="8" height="8" rx="0.5" fill="none" stroke="#b89a5a" strokeWidth="1.2" />
            <path d="M22 14 Q14 16 10 24 L10 52 Q10 58 16 58 L36 58 Q42 58 42 52 L42 24 Q38 16 30 14 Z" fill="none" stroke="#b89a5a" strokeWidth="1.2" />
            <path d="M23 16 Q16 18 13 26 L13 50 Q13 55 17 55 L35 55 Q39 55 39 50 L39 26 Q36 18 29 16 Z" fill="url(#liq)" opacity="0.18" />
            <path d="M20 22 Q19 36 20 50" stroke="#d4b97a" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
            <line x1="15" y1="36" x2="37" y2="36" stroke="#b89a5a" strokeWidth="0.6" opacity="0.4" />
            <ellipse cx="26" cy="6" rx="3" ry="1.5" fill="#b89a5a" opacity="0.3" />
            <defs>
              <linearGradient id="liq" x1="13" y1="16" x2="39" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d4b97a" />
                <stop offset="100%" stopColor="#8a6a30" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Compact inline logo for nav headers on inner pages */
export function CommonScentsNavLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mini flacon icon with rings */}
      <div className="relative flex items-center justify-center" style={{ width: 36, height: 36 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(184,154,90,0.3)" }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: -2, width: 4, height: 4, background: "#b89a5a", boxShadow: "0 0 6px #b89a5a" }}
          />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full"
          style={{ inset: 5, border: "1px solid rgba(184,154,90,0.15)" }}
        />
        <svg width="16" height="20" viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
          <rect x="19" y="1" width="14" height="5" rx="1" fill="none" stroke="#b89a5a" strokeWidth="2" />
          <rect x="22" y="6" width="8" height="8" rx="0.5" fill="none" stroke="#b89a5a" strokeWidth="2" />
          <path d="M22 14 Q14 16 10 24 L10 52 Q10 58 16 58 L36 58 Q42 58 42 52 L42 24 Q38 16 30 14 Z" fill="none" stroke="#b89a5a" strokeWidth="2" />
          <path d="M23 16 Q16 18 13 26 L13 50 Q13 55 17 55 L35 55 Q39 55 39 50 L39 26 Q36 18 29 16 Z" fill="#b89a5a" opacity="0.2" />
          <path d="M20 22 Q19 36 20 50" stroke="#d4b97a" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className="text-warm-black"
          style={{ fontFamily: "'Allura', cursive", fontStyle: "italic", fontSize: "1.35rem" }}
        >
          CommonScents
        </span>
        <span
          className="mt-0.5 text-gold"
          style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.44rem", letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.8 }}
        >
          Discover · Curate · Collect
        </span>
      </div>
    </div>
  );
}
