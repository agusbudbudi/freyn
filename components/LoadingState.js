"use client";

export default function LoadingState({
  message = "Loading...",
  description = "",
  icon = "uil uil-spinner-alt",
  size = "3rem",
  className = "",
}) {
  const iconStyle = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 py-8 px-4 text-slate-500 ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <i
        className={`${icon} text-[#813afb] animate-spin`}
        style={{ fontSize: iconStyle }}
        aria-hidden="true"
      ></i>
      {message && <p className="m-0 text-sm">{message}</p>}
      {description && <p className="m-0 text-[13px]">{description}</p>}
    </div>
  );
}
