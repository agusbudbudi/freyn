export default function SearchInput({ value, onChange, onClear, placeholder, className = "" }) {
  return (
    <div className={`relative flex items-center w-[300px] max-w-full ${className}`}>
      <i className="uil uil-search absolute left-3 text-slate-500 text-base z-[1]"></i>
      <input
        type="text"
        className="w-full py-2 pl-10 pr-3 border border-solid border-slate-200 rounded-inputs text-sm bg-slate-50 text-slate-900 transition-all duration-200 focus:outline-none focus:border-signal-blue focus:ring-[3px] focus:ring-sky-wash placeholder:text-slate-500 hover:border-slate-300"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 flex items-center bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded hover:bg-slate-100 hover:text-slate-900"
          onClick={onClear}
        >
          <i className="uil uil-times"></i>
        </button>
      )}
    </div>
  );
}
