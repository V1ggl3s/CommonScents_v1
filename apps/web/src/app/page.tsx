import { HeroSection } from "@/components/home/hero-section";
import { ParallaxSection } from "@/components/home/parallax-section";
import { SpinningBottleSection } from "@/components/home/spinning-bottle-section";
import { EmotionSection } from "@/components/home/emotion-section";
import { RegionSection } from "@/components/home/region-section";
import { SearchSection } from "@/components/home/search-section";
import { AmbientStrip } from "@/components/home/ambient-strip";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ParallaxSection />
      <SpinningBottleSection />
      <RegionSection />
      <EmotionSection />
      <SearchSection />
      <AmbientStrip />
    </main>
  );
}
