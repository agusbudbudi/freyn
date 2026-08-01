const variants = {
  view: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  edit: "bg-signal-blue text-white hover:bg-[#0070e0]",
  delete: "bg-red-500 text-white hover:bg-red-600",
};

export default function ActionButton({ variant, icon, onClick, title, disabled }) {
  return (
    <button
      className={`inline-flex items-center justify-center w-8 h-8 border-none rounded-lg cursor-pointer transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px ${variants[variant]}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <i className={icon}></i>
    </button>
  );
}
