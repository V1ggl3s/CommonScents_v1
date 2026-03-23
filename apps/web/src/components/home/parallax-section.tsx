"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const RENDERS = [
  { src: "/renders/rose.avif", alt: "Rose petals from Grasse", label: "Rose · Grasse" },
  { src: "/renders/oud.jpg",   alt: "Oud wood from Assam",    label: "Oud · Assam" },
  { src: "/renders/vanilla.webp", alt: "Vanilla from Madagascar", label: "Vanilla · Madagascar" },
];

export function ParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Images move slower than the scroll — classic parallax
  const imagesY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  // Text moves at a medium speed
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  // Vignette intensifies at section edges
  const vignetteOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.85, 0.55, 0.55, 0.85]
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-[#120a0e]"
      style={{ minHeight: "85vh" }}
    >
      {/* ── Three renders, side by side, parallax shifted ── */}
      <motion.div
        style={{ y: imagesY }}
        className="absolute inset-0 -top-[12%] h-[124%] flex"
      >
        {RENDERS.map((render, i) => (
          <div
            key={i}
            className="relative flex-1"
            style={{
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}
          >
            <Image
              src={render.src}
              alt={render.alt}
              fill
              sizes="33vw"
              className="object-cover"
              style={{ opacity: 0.55 }}
              priority={i === 0}
            />

            {/* Warm dark colour wash — ties all three panels to the charcoal palette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(28,18,10,0.45) 0%, rgba(28,18,10,0.15) 40%, rgba(28,18,10,0.50) 100%)",
              }}
            />

            {/* Per-panel ingredient label at the bottom */}
            <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6">
              <span
                className="text-gold/70"
                style={{
                  fontFamily: "'Tenor Sans', sans-serif",
                  fontSize: "0.58rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                }}
              >
                {render.label}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Global vignette — darkens edges so text is always legible ── */}
      <motion.div
        style={{ opacity: vignetteOpacity }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,rgba(18,10,14,0.15),rgba(18,10,14,0.92))] pointer-events-none"
      />

      {/* ── Dark gradient top/bottom fade into adjacent sections ── */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-warm-charcoal to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-warm-charcoal to-transparent pointer-events-none" />

      {/* ── Centred text content ── */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-xs font-medium uppercase tracking-[0.35em] text-gold/70"
          style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 700 }}
        >
          The raw materials of luxury
        </motion.p>

        {/* Thin gold rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          viewport={{ once: true }}
          className="mt-4 h-px w-16 origin-center bg-gradient-to-r from-transparent via-gold to-transparent"
        />

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-5 font-heading text-4xl font-light text-ivory sm:text-5xl lg:text-7xl"
        >
          From earth to essence
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-5 max-w-md text-base leading-relaxed text-ivory/65 sm:text-lg"
        >
          Rose petals from Grasse. Oud from Assam. Vanilla from Madagascar.
          The finest fragrances begin with the rarest ingredients.
        </motion.p>
      </motion.div>
    </section>
  );
}
