import Invoice from "@/models/Invoice";

export const STATUSES = ["draft", "sent", "paid"];
export const MAX_LOGO_BYTES = 900 * 1024;
export const PAYMENT_METHOD_TYPES = ["bank_transfer", "e_wallet"];

export function estimateDataUrlBytes(dataUrl = "") {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function sanitizeParty(party = {}) {
  return {
    name: party.name?.toString().trim() || "",
    email: party.email?.toString().trim() || "",
    phone: party.phone?.toString().trim() || "",
    company: party.company?.toString().trim() || "",
    address: party.address?.toString().trim() || "",
    clientId: party.clientId?.toString().trim() || "",
  };
}

export function sanitizeItems(rawItems) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  const sanitized = [];

  for (const item of items) {
    if (!item) continue;
    const serviceId = item.serviceId?.toString().trim();
    const serviceName = item.serviceName?.toString().trim();
    if (!serviceId || !serviceName) {
      continue;
    }

    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const price = Number(item.price) >= 0 ? Number(item.price) : 0;
    const deliverables = item.deliverables?.toString() || "";
    const subtotal = quantity * price;

    sanitized.push({
      serviceId,
      serviceName,
      deliverables,
      quantity,
      price,
      subtotal,
    });
  }

  return sanitized;
}

export function sanitizePaymentMethod(raw = {}) {
  const type = PAYMENT_METHOD_TYPES.includes(raw.type)
    ? raw.type
    : "bank_transfer";

  const bank = raw.bank || {};
  const ewallet = raw.ewallet || {};

  return {
    type,
    bank: {
      name: bank.name?.toString().trim() || "",
      accountName: bank.accountName?.toString().trim() || "",
      accountNumber: bank.accountNumber?.toString().trim() || "",
    },
    ewallet: {
      provider: ewallet.provider?.toString().trim() || "",
      accountName: ewallet.accountName?.toString().trim() || "",
      phoneNumber: ewallet.phoneNumber?.toString().trim() || "",
    },
  };
}

export async function ensureInvoiceNumber(invoiceNumber, invoiceDate) {
  if (invoiceNumber) {
    return invoiceNumber.trim();
  }
  return Invoice.generateInvoiceNumber(invoiceDate || new Date());
}

export function toInvoiceResponse(invoice) {
  if (!invoice) return null;
  const obj =
    typeof invoice.toObject === "function"
      ? invoice.toObject({ getters: true, virtuals: false })
      : { ...invoice };

  const { _id, __v, ...rest } = obj;
  return {
    ...rest,
    id: _id?.toString() || invoice.id || invoice._id?.toString() || "",
  };
}

export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;
  return { subtotal, total };
}
