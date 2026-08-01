export default function BackButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-500 border border-solid border-slate-200 text-xl transition-colors duration-200 hover:bg-slate-50 ${className}`}
      onClick={onClick}
      aria-label="Go back"
    >
      <i className="uil uil-arrow-left"></i>
    </button>
  );
}
