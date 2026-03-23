"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";

export function EmotionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-warm-charcoal px-6 py-24 sm:py-32"
    >
      {/* Background image with parallax — moody atmospheric */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -top-[10%] h-[120%]"
      >
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80&auto=format"
          alt=""
          className="h-full w-full object-cover opacity-15"
          loading="lazy"
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-warm-charcoal/95 via-warm-charcoal/90 to-warm-charcoal/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_50%,rgba(184,150,90,0.08),transparent)]" />

      <div className="relative mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:gap-16 items-center">
        <BlurFade delay={0.1} inView>
          <div>
            {/* Gold decorative line */}
            <div className="mb-6 h-px w-16 bg-gradient-to-r from-gold to-transparent" />
            <blockquote className="font-heading text-3xl font-light leading-snug text-gold sm:text-4xl lg:text-5xl">
              &ldquo;Smell is the only sense with a direct line to memory.&rdquo;
            </blockquote>
            <div className="mt-6 h-px w-16 bg-gradient-to-r from-gold to-transparent" />
          </div>
        </BlurFade>

        <BlurFade delay={0.3} inView>
          <div className="space-y-5 text-base leading-relaxed text-ivory/70 sm:text-lg">
            <p>
              The olfactory system is unique among the senses. Unlike sight or
              sound, scent bypasses the rational brain entirely, connecting
              directly to the limbic system — the seat of emotion and memory.
            </p>
            <p>
              A single note of jasmine can transport you to a garden from
              childhood. The trace of leather and tobacco can summon someone you
              haven&apos;t seen in decades. Fragrance doesn&apos;t describe a
              moment — it recreates it.
            </p>
            <p className="font-medium text-ivory">
              This is why fragrance is the most personal luxury. It is invisible,
              intimate, and irreplaceable.
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
