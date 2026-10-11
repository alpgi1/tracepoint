/**
 * The decision action in the static showcase build: there is no server, the
 * decision form is never rendered (the stored data is never live), and
 * next.config.ts points the action's import here so no server action is built.
 */
export async function decideRequirement(): Promise<void> {}
