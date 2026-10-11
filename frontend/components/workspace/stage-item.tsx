"use client";

import Link, { useLinkStatus } from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { FULL_PREFETCH } from "@/lib/static";
import { type StageKey, stageOfSegment } from "@/lib/workspace/stages";

/*
 * One stage of the bar as a link (step 20). The bar lives in the scope
 * layout and stays on screen between the stages, so the current stage
 * follows the route segment on the client: it moves the moment the
 * navigation commits, before the new screen's content arrives. Where the
 * screen's frame was not prefetched yet, the clicked stage shows its rule
 * faintly until then, so a click is answered at once.
 */
export interface StageItemProps {
  stage: StageKey;
  href: string;
  prefetch?: boolean;
  children: ReactNode;
}

export function StageItem({ stage, href, prefetch, children }: StageItemProps) {
  const current = stageOfSegment(useSelectedLayoutSegment()) === stage;
  return (
    <li className="stage" data-current={current ? "true" : undefined}>
      <Link href={href} prefetch={prefetch ? FULL_PREFETCH : undefined} className="stage-link" aria-current={current ? "page" : undefined}>
        {children}
        <PendingRule />
      </Link>
    </li>
  );
}

function PendingRule() {
  const { pending } = useLinkStatus();
  return <span className="stage-pending-rule" data-pending={pending ? "true" : undefined} aria-hidden="true" />;
}
