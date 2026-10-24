/**
 * Junta classes condicionalmente (substituto enxuto do clsx p/ design system).
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
