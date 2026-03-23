"use client";

import { Marquee } from "@/components/ui/marquee";

const NOTES = [
  "Rose",
  "Oud",
  "Bergamot",
  "Sandalwood",
  "Iris",
  "Vetiver",
  "Amber",
  "Neroli",
  "Musk",
  "Cedarwood",
  "Jasmine",
  "Vanilla",
  "Patchouli",
  "Tonka Bean",
  "Lavender",
  "Saffron",
  "Pink Pepper",
  "Leather",
];

function NoteItem({ name }: { name: string }) {
  return (
    <span className="mx-4 text-sm font-medium uppercase tracking-[0.2em] text-gold/70 sm:mx-6 sm:text-base">
      {name}
    </span>
  );
}

export function AmbientStrip() {
  return (
    <section className="overflow-hidden border-t border-gold/10 bg-ivory py-6 sm:py-8">
      <Marquee pauseOnHover className="[--duration:60s] [--gap:0]">
        {NOTES.map((note) => (
          <NoteItem key={note} name={note} />
        ))}
      </Marquee>
    </section>
  );
}
