"use client";

// Lightweight DOM-based toast utility (no deps), mimicking legacy showAlert()
// Usage:
//   import { toast, showAlert } from "@/components/ui/toast";
//   toast.success("Saved!"); toast.error("Failed");
//   showAlert("Message", "success" | "error"); // legacy-compatible alias
const ICONS = {
  success: "check-circle",
  error: "exclamation-circle",
  info: "info-circle",
};

const COLORS = {
  success: "#10b981", // emerald
  error: "#ef4444", // red
  info: "#3b82f6", // blue
  title: "#111827", // gray-900
  message: "#6b7280", // gray-500
  close: "#9ca3af", // gray-400
};

function ensureContainer() {
  let el = document.getElementById("toast-container");
  if (el) return el;

  el = document.createElement("div");
  el.id = "toast-container";
  // Inline styles to avoid needing global CSS
  el.style.position = "fixed";
  el.style.top = "16px";
  el.style.right = "16px";
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.gap = "8px";
  el.style.zIndex = "2000"; // above modals
  el.style.pointerEvents = "none"; // clicks pass through except on toast itself
  document.body.appendChild(el);
  return el;
}

export function showToast(message, type = "success", options = {}) {
  if (typeof window === "undefined") return;
  const container = ensureContainer();
  const color = COLORS[type] || COLORS.info;
  const icon = ICONS[type] || ICONS.info;
  const titleText =
    options.title ??
    (type === "success" ? "Success" : type === "error" ? "Error" : "Info");
  const duration = Number(options.duration || 3000);

  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.style.background = "#fff";
  toast.style.color = COLORS.title;
  toast.style.borderRadius = "8px";
  toast.style.padding = "12px 14px";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
  toast.style.borderLeft = `4px solid ${color}`;
  toast.style.minWidth = "280px";
  toast.style.maxWidth = "420px";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-6px)";
  toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  toast.style.pointerEvents = "auto";

  // Icon
  const iconWrap = document.createElement("div");
  iconWrap.style.marginRight = "10px";
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.color = color;
  iconWrap.style.fontSize = "20px";
  const iconEl = document.createElement("i");
  iconEl.className = `uil uil-${icon}`;
  iconWrap.appendChild(iconEl);

  // Content
  const content = document.createElement("div");
  content.style.flex = "1";

  const titleEl = document.createElement("div");
  titleEl.style.fontWeight = "600";
  titleEl.style.marginBottom = "2px";
  titleEl.textContent = titleText;

  const msgEl = document.createElement("div");
  msgEl.style.fontSize = "12px";
  msgEl.style.color = COLORS.message;
  msgEl.textContent = String(message ?? "");

  content.appendChild(titleEl);
  content.appendChild(msgEl);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.style.marginLeft = "10px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "0";
  closeBtn.style.color = COLORS.close;
  closeBtn.style.fontSize = "18px";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  const closeIcon = document.createElement("i");
  closeIcon.className = "uil uil-times";
  closeBtn.appendChild(closeIcon);

  const remove = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 200);
  };
  closeBtn.addEventListener("click", remove);

  let hideTimer = null;
  toast.addEventListener("mouseenter", () => {
    if (hideTimer) clearTimeout(hideTimer);
  });
  toast.addEventListener("mouseleave", () => {
    if (duration > 0) {
      hideTimer = setTimeout(remove, 1500);
    }
  });

  toast.appendChild(iconWrap);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Auto hide
  if (duration > 0) {
    hideTimer = setTimeout(remove, duration);
  }

  return { close: remove };
}

export const toast = {
  success: (message, options) => showToast(message, "success", options),
  error: (message, options) => showToast(message, "error", options),
  info: (message, options) => showToast(message, "info", options),
};

// Legacy-compatible alias
export function showAlert(message, type = "success") {
  return showToast(message, type);
}
