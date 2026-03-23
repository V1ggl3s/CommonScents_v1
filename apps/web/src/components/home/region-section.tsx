"use client";

import { BlurFade } from "@/components/ui/blur-fade";

const REGIONS = [
  {
    name: "Middle East",
    description: "Dense, ceremonial, generous.",
    accords: ["Oud", "Amber", "Rose"],
    gradient: "from-amber-900/30 via-amber-800/10 to-transparent",
    accent: "border-amber-500/40 hover:border-amber-400/60",
    tagStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    name: "France",
    description: "Structured, intellectual, refined.",
    accords: ["Aldehydes", "Iris", "Leather"],
    gradient: "from-purple-900/20 via-purple-800/5 to-transparent",
    accent: "border-purple-400/30 hover:border-purple-400/50",
    tagStyle: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  },
  {
    name: "Italy",
    description: "Light, solar, effortless.",
    accords: ["Citrus", "Neroli", "Green Herbs"],
    gradient: "from-emerald-800/20 via-emerald-700/5 to-transparent",
    accent: "border-emerald-400/30 hover:border-emerald-400/50",
    tagStyle: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  },
  {
    name: "Asia Pacific",
    description: "Understated, clean, contemplative.",
    accords: ["Cherry Blossom", "Incense", "Soft Musk"],
    gradient: "from-rose-800/20 via-rose-700/5 to-transparent",
    accent: "border-rose-400/30 hover:border-rose-400/50",
    tagStyle: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  },
];

export function RegionSection() {
  return (
    <section className="relative overflow-hidden bg-surface-alt px-6 py-24 sm:py-32">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(184,150,90,0.08),transparent)]" />

      <div className="relative mx-auto max-w-5xl">
        <BlurFade delay={0.1} inView>
          <p
            className="text-center text-xs uppercase tracking-[0.35em] text-gold/70"
            style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 700 }}
          >
            A world of scent
          </p>

          {/* Thin gold rule — mirrors parallax section */}
          <div className="mt-4 flex justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>

          <h2 className="mt-5 text-center font-heading text-3xl font-light text-warm-black sm:text-4xl lg:text-5xl">
            Scent and Region
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-text-secondary sm:text-lg">
            Every region of the world has a distinct olfactory signature — shaped
            by climate, culture, and centuries of tradition.
          </p>
        </BlurFade>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REGIONS.map((region, i) => (
            <BlurFade key={region.name} delay={0.15 + i * 0.1} inView>
              <div
                className={`group relative overflow-hidden rounded-xl border ${region.accent} bg-white/80 p-6 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-gold/10`}
              >
                {/* Color gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${region.gradient} opacity-60 transition-opacity group-hover:opacity-100`} />

                <div className="relative">
                  <h3 className="font-heading text-xl font-medium text-warm-black sm:text-2xl">
                    {region.name}
                  </h3>
                  <p className="mt-2 text-sm italic text-text-secondary">
                    {region.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {region.accords.map((accord) => (
                      <span
                        key={accord}
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${region.tagStyle}`}
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
