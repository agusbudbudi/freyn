export default function FormField({ label, className = "", children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
        {label}
      </label>
      {children}
    </div>
  );
}
