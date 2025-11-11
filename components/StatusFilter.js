"use client";

export default function StatusFilter({ options = [], value, onChange }) {
  if (!options.length) return null;

  return (
    <div className="status-filter">
      {options.map((option) => {
        const isActive = option.value === value;
        const label = option.value === "all" ? "All" : option.label;
        return (
          <button
            key={option.value}
            type="button"
            className={`status-filter__tab ${
              isActive ? "status-filter__tab--active" : ""
            }`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
          >
            <span className="status-filter__label">{label}</span>
            <span className="status-filter__count">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
