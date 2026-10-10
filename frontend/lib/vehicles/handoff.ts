/**
 * Hand-over from the map to the vehicle screen: the card's photo grows to
 * full screen, moves to the place the drawing has on the next screen, and
 * the next screen starts with that photo before fading to the sketch. The
 * flag lives in sessionStorage for the one navigation; a direct visit shows
 * the sketch at once.
 */
const KEY = "tracepoint:handoff";

export function setHandoff(code: string) {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    // storage unavailable: the next screen shows the sketch directly
  }
}

export function takeHandoff(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
