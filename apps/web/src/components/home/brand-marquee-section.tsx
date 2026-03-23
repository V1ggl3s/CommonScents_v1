"use client";

import type { CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

type Brand = { name: string; src: string };

const MIDDLE_EASTERN: Brand[] = [
  { name: "Afnan", src: "/brands/middle-eastern/afnan.webp" },
  { name: "Ajmal", src: "/brands/middle-eastern/ajmal.webp" },
  { name: "Al Haramain", src: "/brands/middle-eastern/Al haramain.png" },
  { name: "French Avenue", src: "/brands/middle-eastern/french ave.png" },
  { name: "Gissah", src: "/brands/middle-eastern/gissah.jpg" },
  { name: "Khadlaj", src: "/brands/middle-eastern/khadlaj.webp" },
  { name: "Lattafa", src: "/brands/middle-eastern/lattafa.jpg" },
  { name: "Rasasi", src: "/brands/middle-eastern/rasasi.jpg" },
  { name: "Swiss Arabian", src: "/brands/middle-eastern/swiss arabian.webp" },
];

const DESIGNER: Brand[] = [
  { name: "Burberry", src: "/brands/designer/burberry.avif" },
  { name: "Chanel", src: "/brands/designer/chanel.png" },
  { name: "D&G", src: "/brands/designer/D&G.png" },
  { name: "Dior", src: "/brands/designer/dior.jpg" },
  { name: "JPG", src: "/brands/designer/jpg.png" },
  { name: "Brand", src: "/brands/designer/o.99.jpg" },
  { name: "Prada", src: "/brands/designer/prada.svg" },
  { name: "Valentino", src: "/brands/designer/valentino.webp" },
];

const NICHE: Brand[] = [
  { name: "Amouage", src: "/brands/niche/amouage.webp" },
  { name: "BDK Parfums", src: "/brands/niche/bdk.webp" },
  { name: "Creed", src: "/brands/niche/creed.jpg" },
  { name: "Ex Nihilo", src: "/brands/niche/ex nihilo.png" },
  { name: "Initio", src: "/brands/niche/initio.webp" },
  { name: "Kilian Paris", src: "/brands/niche/kilian.png" },
  { name: "Maison Francis Kurkdjian", src: "/brands/niche/mfk.jpg" },
  { name: "Parfums de Marly", src: "/brands/niche/pdm.png" },
  { name: "Penhaligon's", src: "/brands/niche/Penhaligons.png" },
  { name: "Roja Parfums", src: "/brands/niche/roja.webp" },
  { name: "Xerjoff", src: "/brands/niche/xerjoff.webp" },
];

const COPIES = 2;

function ConveyorRow({
  brands,
  direction,
  durationSec,
}: {
  brands: Brand[];
  direction: "left" | "right";
  durationSec: number;
}) {
  const reduceMotion = useReducedMotion();
  const chained = Array.from({ length: COPIES }, () => brands).flat();

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24"
        style={{
          background: "linear-gradient(to right, var(--fade-from) 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24"
        style={{
          background: "linear-gradient(to left, var(--fade-from) 0%, transparent 100%)",
        }}
      />

      <div
        className="flex w-max shrink-0 items-center gap-4 will-change-transform"
        style={
          reduceMotion
            ? {}
            : {
                animation: `brand-scroll ${durationSec}s linear infinite`,
                animationDirection: direction === "right" ? "reverse" : "normal",
              }
        }
      >
        {chained.map((brand, i) => (
          <BrandLogo key={`${brand.name}-${i}`} brand={brand} />
        ))}
      </div>
    </div>
  );
}

function BrandLogo({ brand }: { brand: Brand }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-white/90 px-6 shadow-sm shadow-gold/5"
      style={{
        height: "68px",
        minWidth: "132px",
        maxWidth: "200px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.src}
        alt=""
        loading="eager"
        decoding="async"
        className="block h-10 w-auto max-w-[160px] object-contain opacity-90"
      />
    </div>
  );
}

export function BrandMarqueeSection() {
  return (
    <section
      className="relative overflow-hidden border-y border-gold/10 bg-surface-alt py-8 sm:py-10"
      style={
        {
          ["--fade-from" as string]: "#F2EFE9",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(184,150,90,0.06),transparent)]" />

      <div className="relative flex flex-col gap-4">
        <ConveyorRow brands={MIDDLE_EASTERN} direction="right" durationSec={38} />
        <ConveyorRow brands={DESIGNER} direction="left" durationSec={44} />
        <ConveyorRow brands={NICHE} direction="right" durationSec={50} />
      </div>
    </section>
  );
}
