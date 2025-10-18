"use client";

export default function StatusFilter({ options = [], value, onChange }) {
  if (!options.length) return null;

  return (
    <div className="status-filter">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`status-filter__chip ${
              isActive ? "status-filter__chip--active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            <span className="status-filter__count">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
