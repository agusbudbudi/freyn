const statusStyles = {
  "status-todo": "bg-[#fef9c3] text-[#a16207]",
  "status-progress": "bg-[#e0f2fe] text-[#0369a1]",
  "status-payment": "bg-[#ffe4e6] text-[#be123c]",
  "status-waiting": "bg-[#ffe4e6] text-[#be123c]",
  "status-review": "bg-[#f3e8ff] text-[#6b21a8]",
  "status-revision": "bg-[#ffedd5] text-[#c2410c]",
  "status-done": "bg-[#dcfce7] text-[#15803d]",
};

export default function StatusBadge({ status, children }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize whitespace-nowrap gap-1 ${statusStyles[status] || statusStyles["status-todo"]}`}
    >
      {children}
    </span>
  );
}
