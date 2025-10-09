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
    <div className={`loading-state ${className}`.trim()} role="status" aria-live="polite">
      <i
        className={`${icon} loading-spinner`}
        style={{ fontSize: iconStyle }}
        aria-hidden="true"
      ></i>
      {message && <p className="loading-message">{message}</p>}
      {description && <p className="loading-description">{description}</p>}
    </div>
  );
}
