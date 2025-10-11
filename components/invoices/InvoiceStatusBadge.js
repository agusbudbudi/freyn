"use client";

const STATUS_MAP = {
  draft: {
    label: "Draft",
    className: "status-label status-pending",
  },
  sent: {
    label: "Sent",
    className: "status-label status-review",
  },
  paid: {
    label: "Paid",
    className: "status-label status-success",
  },
};

export default function InvoiceStatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  const info = STATUS_MAP[normalized] || STATUS_MAP.draft;

  return <span className={info.className}>{info.label}</span>;
}
