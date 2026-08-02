import { twMerge } from "tailwind-merge";

// Plain string concatenation (`${base} ${override}`) does not guarantee the
// override wins: Tailwind classes have equal specificity, so the winner is
// whichever utility appears later in the generated stylesheet, not later in
// the className string. twMerge resolves conflicts by Tailwind property
// (e.g. border-slate-100 vs border-signal-blue) so the last class always wins.
export function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(" "));
}
