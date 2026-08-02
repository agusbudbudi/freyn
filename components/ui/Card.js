import { cn } from "@/lib/cn";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={cn("bg-white rounded-xl border border-solid border-slate-100 shadow-card overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={cn("p-4 flex justify-between items-center gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ icon, className = "", children, ...props }) {
  return (
    <h3 className={cn("text-base font-semibold text-slate-900 m-0 flex items-center", className)} {...props}>
      {icon}
      {children}
    </h3>
  );
}

export function CardSubtitle({ className = "", children, ...props }) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1 mb-0", className)} {...props}>{children}</p>
  );
}

export function CardBody({ className = "", children, ...props }) {
  return <div className={className} {...props}>{children}</div>;
}
