import { workspaceScopes } from "./workspace";

/*
 * The agents' texts name other requirements by their id ("from the change
 * profile of REQ-G60-US-PR-03", "onboarding (REQ-G60-US-GE-01)"). On screen
 * the id gives way to the requirement's title (step 20); the id stays in the
 * stored data and the exports. Server side: it reads the stored workspaces.
 */
const ID = /REQ-[A-Z0-9]{3}-[A-Z]{2,3}-[A-Z]{2}-\d{2}/g;

let titles: Map<string, string> | null = null;

function titleOf(id: string): string | undefined {
  titles ??= new Map(workspaceScopes().flatMap((s) => s.requirements.map((r) => [r.id, r.title] as const)));
  return titles.get(id);
}

/** A text with every requirement id it mentions replaced by the requirement's title in quotes. */
export function nameRequirements(text: string): string {
  return text.replace(ID, (id) => {
    const title = titleOf(id);
    return title ? `“${title}”` : id;
  });
}
