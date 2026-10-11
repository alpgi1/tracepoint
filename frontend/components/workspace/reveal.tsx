"use client";

import { usePathname } from "next/navigation";
import { type ComponentPropsWithoutRef, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";

/*
 * The arrival of a screen's content (step 20, forbidden list exemption E6).
 * When a screen of the workspace is reached by navigation, its blocks rise
 * into place one after another: 10 px and a fade over 380 ms, 40 ms apart,
 * the eighth block and every later one together. Method after the staggered
 * groups of the 21st.dev survey (Motion Primitives "Animated Group", Magic
 * UI "Blur Fade", research notes 6.6): the stagger and the short rise were
 * taken; the blur, the spring and the animation library were not. Web
 * Animations on transform and opacity, started before the first paint of
 * the new content, so nothing flashes.
 *
 * Three cases show the content at once: it was painted by the server
 * before the script ran (a direct visit, the content is already readable),
 * the same page was rendered again for a new query (a view tab, a filter,
 * the outcome of a decision), and reduced motion.
 */
const DURATION_MS = 380;
const STAGGER_MS = 40;
const MAX_STEPS = 7;
const RISE_PX = 10;
const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
/** A page left and entered again on the same path within this window was re-rendered for a new query. */
const SAME_PAGE_MS = 800;

let left: { path: string; at: number } | null = null;

function isArrival(path: string, client: boolean): boolean {
  if (!client) return false;
  return !(left && left.path === path && performance.now() - left.at < SAME_PAGE_MS);
}

const noSubscription = () => () => {};

type RevealProps = {
  as?: "section" | "div" | "aside";
  /** The blocks that rise, by default the element's children. */
  selector?: string;
  /** Milliseconds before the first block starts, to follow another move. */
  delay?: number;
} & ComponentPropsWithoutRef<"section">;

export function Reveal({ as: Tag = "section", selector = ":scope > *", delay = 0, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const path = usePathname();
  // False while the server's HTML is hydrated, true for content the client renders.
  const client = useSyncExternalStore(noSubscription, () => true, () => false);
  const started = useRef(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (started.current || !element) return;
    started.current = true;
    if (!isArrival(path, client) || prefersReducedMotion()) return;
    const blocks = element.querySelectorAll<HTMLElement>(selector);
    blocks.forEach((block, i) => {
      block.animate(
        [
          { opacity: 0, transform: `translateY(${String(RISE_PX)}px)` },
          { opacity: 1, transform: "none" },
        ],
        { duration: DURATION_MS, delay: delay + Math.min(i, MAX_STEPS) * STAGGER_MS, easing: EASE, fill: "backwards" },
      );
    });
  }, [path, client, selector, delay]);

  useLayoutEffect(() => {
    return () => {
      left = { path, at: performance.now() };
    };
  }, [path]);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
