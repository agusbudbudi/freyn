import Link from "next/link";

const iconStyles = {
  projects: "bg-[#e0f2fe] text-[#0369a1]",
  calendar: "bg-[#dcfce7] text-[#15803d]",
  invoice: "bg-[#ffe4e6] text-[#be123c]",
};

export default function ShortcutCard({ href, icon, iconVariant, title, description, ariaLabel }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 shadow-card bg-white no-underline text-slate-900 relative overflow-hidden transition-all duration-200 hover:-translate-y-px hover:border-sky-wash hover:shadow-float focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
    >
      <span
        className={`w-11 h-11 rounded-xl inline-flex items-center justify-center text-xl shrink-0 ${iconStyles[iconVariant]}`}
      >
        {icon}
      </span>
      <div className="flex flex-col gap-1 flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <i className="uil uil-angle-right-b text-signal-blue text-lg bg-slate-50 rounded-full w-[30px] h-[30px] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5 shrink-0"></i>
    </Link>
  );
}
