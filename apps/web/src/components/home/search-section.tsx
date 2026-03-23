"use client";

import { BlurFade } from "@/components/ui/blur-fade";

export function SearchSection() {
  return (
    <section className="bg-ivory px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <BlurFade delay={0.1} inView>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-text-secondary/60">
            Fragrance discovery
          </p>
          <h2 className="mt-3 font-heading text-3xl font-light text-warm-black sm:text-4xl lg:text-5xl">
            Looking for something similar?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary sm:text-lg">
            Discover affordable alternatives and hidden gems.
            Every great fragrance has a story — and often, a worthy counterpart.
          </p>
        </BlurFade>

        <BlurFade delay={0.3} inView>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                original: "Dior Sauvage Elixir",
                clone: "Lattafa Asad",
                category: "Spicy Amber",
              },
              {
                original: "Bvlgari Tygar",
                clone: "Afnan Turathi Blue",
                category: "Fresh Citrus",
              },
              {
                original: "Tom Ford Tobacco Vanille",
                clone: "Al Haramain Amber Oud",
                category: "Sweet Tobacco",
              },
            ].map((pair) => (
              <div
                key={pair.original}
                className="group rounded-xl border border-gold/15 bg-white p-5 text-left transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold/60">
                  {pair.category}
                </p>
                <p className="mt-2 font-heading text-lg font-medium text-warm-black">
                  {pair.original}
                </p>
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gold/15" />
                  <span className="text-xs text-gold">similar to</span>
                  <div className="h-px flex-1 bg-gold/15" />
                </div>
                <p className="font-heading text-lg text-text-secondary group-hover:text-gold transition-colors">
                  {pair.clone}
                </p>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
