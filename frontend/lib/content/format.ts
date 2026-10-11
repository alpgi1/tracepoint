/** Number formats for the readouts: short on the map, full in the workspace. */
export function short(n: number): string {
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}m`;
  if (n >= 1000) return `${trim(n / 1000)}k`;
  return String(n);
}

function trim(value: number): string {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return String(rounded);
}

export function full(n: number): string {
  return n.toLocaleString("en-US");
}

export function percent(share: number): string {
  return `${String(Math.round(share * 100))}%`;
}

export function score(value: number): string {
  return value.toFixed(1);
}

/** "1-10 mean" -> "10", "1-7 derived mean" -> "7". */
export function scaleTop(scale: string): string {
  const match = /\d+-(\d+)/.exec(scale);
  return match ? match[1] : scale;
}

/** A CPM weight: whole on the platform ("18"), one decimal where a vehicle's weights are renormalised ("20.9"). */
export function weight(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
