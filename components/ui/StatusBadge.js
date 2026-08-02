export const statusColors = {
  "status-todo": { bg: "#fef9c3", text: "#a16207" },
  "status-progress": { bg: "#e0f2fe", text: "#0369a1" },
  "status-payment": { bg: "#ffe4e6", text: "#be123c" },
  "status-waiting": { bg: "#ffe4e6", text: "#be123c" },
  "status-review": { bg: "#f3e8ff", text: "#6b21a8" },
  "status-revision": { bg: "#ffedd5", text: "#c2410c" },
  "status-done": { bg: "#dcfce7", text: "#15803d" },
};

export function getStatusColors(status) {
  return statusColors[status] || statusColors["status-todo"];
}

export default function StatusBadge({ status, children, className = "" }) {
  const { bg, text } = getStatusColors(status);
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className={`inline-flex items-center px-2 py-0.5 rounded-tags text-[10px] font-semibold capitalize whitespace-nowrap gap-1 ${className}`}
    >
      {children}
    </span>
  );
}
