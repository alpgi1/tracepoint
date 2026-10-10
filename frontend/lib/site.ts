/**
 * Product copy lives here, not inside components, so the words are reviewed
 * in one place. UI language is English (plan decision D-001). Every claim
 * below is covered by plan/00-master-plan.md; no numbers are invented.
 */
export const site = {
  name: "Tracepoint",
  domain: "https://tracepoint.local",
  tagline: "Customer requirements, traced back to their evidence",
  description:
    "Tracepoint turns verbatims, customer studies, sales volumes and equipment lists into measurable customer requirements per market, with the product manager deciding at every gate. Hackathon prototype for BMW product managers.",
  header: {
    status: "Internal prototype",
    year: "2026",
  },
  hero: {
    eyebrow: "Customer requirements · F70 · G60 · G70",
    title: "Customer requirements for three markets, traced back to their evidence.",
    lead: "Tracepoint turns verbatims, customer studies, sales volumes and equipment lists into measurable requirements per market. The product manager decides at every gate, and every decision keeps its trail.",
    marketsLabel: "Pick a market",
    globeLabel:
      "Globe with three markets: China, the United States and the European Union. Drag to rotate; use the market buttons to select one.",
    restingReadout: "Three markets",
    selectedReadout: "selected",
    back: "Back to the globe",
    source: "Natural Earth · 1:110m",
  },
  footer: {
    line: "Evidence-first customer requirements for product managers.",
    data: "Boundaries from Natural Earth, 1:110m, public domain. Malta is below that resolution and is not drawn.",
  },
} as const;
