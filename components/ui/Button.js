import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-signal-blue text-white border border-transparent hover:bg-[#0070e0]",
  secondary: "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-500 border border-transparent hover:bg-slate-50 hover:text-slate-900",
  outline: "bg-transparent text-signal-blue border border-signal-blue hover:bg-slate-50",
  danger: "bg-red-500 text-white border border-transparent hover:bg-red-600",
  warning: "bg-amber-500/[0.18] text-amber-800 border border-amber-500/40 hover:bg-amber-500/[0.28]",
};

const sizes = {
  sm: "py-2 px-4 text-xs rounded-buttons",
  md: "py-2 px-4 text-sm rounded-buttons",
};

export function buttonClasses({ variant = "primary", size = "md", className = "" } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap border-solid transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    className
  );
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
