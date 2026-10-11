import { MapStage } from "@/components/landing/map-stage";
import { cpmIntro } from "@/lib/content/cpm-intro";
import { effortContent } from "@/lib/data/effort";

export default function Home() {
  return <MapStage intro={cpmIntro(effortContent())} />;
}
