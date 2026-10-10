/**
 * Product copy lives here, not inside components. UI language is English
 * (plan decision D-001). The landing page shows no visible text; what is
 * below is metadata and assistive text.
 */
export const site = {
  name: "Tracepoint",
  domain: "https://tracepoint.local",
  title: "Tracepoint",
  description:
    "Customer requirements for three markets, traced back to their evidence. Hackathon prototype for BMW product managers.",
  map: {
    label:
      "World map with three markets: China, the United States and the European Union. Hover a market to highlight it, click to magnify it, press Escape to return.",
    marketsLabel: "Markets",
    restingStatus: "Three markets on the map",
  },
} as const;
