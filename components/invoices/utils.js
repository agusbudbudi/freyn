import { format } from "date-fns";

export function generateInvoiceNumber(date = new Date()) {
  const d = new Date(date || Date.now());
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = `${d.getFullYear()}`;
  const random = Math.floor(Math.random() * 900) + 100;
  return `INV-${day}${month}${year}${random}`;
}

export function formatCurrency(amount, currency = "IDR") {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  } catch (error) {
    return `${currency} ${Number(amount || 0).toFixed(0)}`;
  }
}

export function formatDateForInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

export function formatDateHuman(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd MMM yyyy");
}

export function calculateInvoiceTotals(items, manualTotal = null) {
  const subtotal = (items || []).reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );
  const total = manualTotal != null ? manualTotal : subtotal;
  return { subtotal, total };
}

export function cleanDeliverables(html = "") {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
