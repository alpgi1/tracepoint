import { MarketStage } from "@/components/landing/market-stage";
import { site } from "@/lib/site";

/*
 * Hero: copy on the left, the market globe on the right (stacked on small
 * screens). The copy is server-rendered and complete before any script runs;
 * the stage adds the shared hover and selection state on the client.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <MarketStage
        copy={
          <>
            <p className="eyebrow intro text-chalk-3" style={{ "--intro-delay": "0ms" } as React.CSSProperties}>
              {site.hero.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="display intro mt-5 max-w-[17ch] text-h1 text-balance"
              style={{ "--intro-delay": "70ms" } as React.CSSProperties}
            >
              {site.hero.title}
            </h1>
            <p
              className="intro mt-6 max-w-[46ch] text-lead text-pretty text-chalk-2"
              style={{ "--intro-delay": "160ms" } as React.CSSProperties}
            >
              {site.hero.lead}
            </p>
          </>
        }
      />
    </section>
  );
}
