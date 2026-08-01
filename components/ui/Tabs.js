export default function Tabs({ tabs, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-[10px] border border-solid border-slate-100 bg-white ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            className={`inline-flex items-center gap-2 py-1.5 px-4 rounded-lg border border-solid border-transparent text-xs font-medium cursor-pointer transition-all duration-200 ${
              isActive
                ? "text-white bg-signal-blue border-signal-blue shadow-[0_1px_3px_rgba(15,23,42,0.15)]"
                : "text-slate-500 bg-white hover:text-slate-900"
            }`}
            aria-pressed={isActive}
            onClick={() => onChange(tab.value)}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold leading-none ${
                  isActive ? "bg-white/20 text-white" : "text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
