function baseFieldClasses(disabled, className = "") {
  return `w-full border border-solid rounded-inputs text-sm bg-white text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:border-signal-blue focus:ring-[3px] focus:ring-sky-wash ${
    disabled
      ? "bg-slate-50 text-slate-500 border-slate-100 cursor-not-allowed"
      : "border-slate-200 hover:border-slate-300"
  } ${className}`;
}

export function inputClasses(disabled, className = "") {
  return baseFieldClasses(disabled, `h-11 py-2 px-4 leading-tight ${className}`);
}

export default function Input({ className = "", ...props }) {
  return <input className={inputClasses(props.disabled, className)} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={baseFieldClasses(props.disabled, `min-h-[88px] py-2 px-4 ${className}`)}
      {...props}
    />
  );
}
