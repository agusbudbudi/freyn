"use client";

const STATUS_MAP = {
  draft: {
    label: "Draft",
    className: "bg-[#fef9c3] text-[#a16207]",
  },
  sent: {
    label: "Sent",
    className: "bg-[#e0f2fe] text-[#0369a1]",
  },
  paid: {
    label: "Paid",
    className: "bg-[#dcfce7] text-[#15803d]",
  },
};

export default function InvoiceStatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  const info = STATUS_MAP[normalized] || STATUS_MAP.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap gap-1.5 ${info.className}`}
    >
      {info.label}
    </span>
  );
}
