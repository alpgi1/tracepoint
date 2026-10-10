/**
 * Product copy lives here, not inside components. UI language is English
 * (plan decision D-001). Every figure next to this copy comes from
 * content/markets.json and carries its source there.
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
  readout: {
    units: "units",
    verbatims: "verbatims",
    noVerbatims: "no verbatims yet",
    highestComplaintShare: "Highest complaint share",
    lowestStudyScore: "Lowest study score",
    of: "of",
  },
  panel: {
    close: "Close",
    vehiclesLabel: "Vehicles sold in this market",
    /** Shown under a vehicle whose drawing is borrowed from another body. */
    drawingNotes: {
      G68: "Drawing shows the standard-wheelbase 5 Series body",
    } as Record<string, string | undefined>,
  },
  workspace: {
    back: "Map",
    stageLabel: "The vehicle as a technical sketch, side and top view",
    domainsHeading: "Domains by complaint share",
    domainsHint: "Share of classified verbatim rows that are complaints. Click a domain to see its themes.",
    rows: "rows",
    complaints: "complaints",
    themesHeading: "Top complaint themes",
    noThemes: "None of the top themes of this vehicle falls in this domain.",
    defects: "defects",
    difficultToUse: "difficult to use",
    wants: "wants",
    noVerbatimsHeading: "No classified verbatims for this market yet",
    noVerbatimsBody: "The customer study is the only evidence here.",
    studyHeading: "Lowest study scores",
    overall: "Overall",
  },
} as const;
