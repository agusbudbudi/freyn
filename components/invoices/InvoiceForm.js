"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { toast } from "@/components/ui/toast";
import InvoicePreview from "./InvoicePreview";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import {
  generateInvoiceNumber,
  formatCurrency,
  formatDateForInput,
  calculateInvoiceTotals,
} from "./utils";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "e_wallet", label: "E-Wallet" },
];

const BANK_OPTIONS = [
  "BCA",
  "BRI",
  "Mandiri",
  "BNI",
  "CIMB Niaga",
  "Permata",
  "OCBC NISP",
  "Danamon",
  "Others",
];

const EWALLET_OPTIONS = [
  "Dana",
  "OVO",
  "ShopeePay",
  "GoPay",
  "LinkAja",
  "Jenius Pay",
];

const MAX_LOGO_MB = 0.9 * 1024 * 1024; // align with backend (~900KB)

const parseCurrencyString = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const normalized = value
    .toString()
    .replace(/[^0-9,\.]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const mapItemsToState = (items = [], currency = "IDR") =>
  items.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const numericPrice = parseCurrencyString(
      item.price ?? item.servicePrice ?? 0
    );
    const subtotal = Number.isFinite(item.subtotal)
      ? item.subtotal
      : quantity * numericPrice;

    return {
      ...item,
      quantity,
      price: formatCurrency(numericPrice, currency),
      subtotal,
    };
  });

const loadDraftContent = () => {
  if (typeof window === "undefined") {
    return { terms: "", footer: "" };
  }
  return {
    terms: localStorage.getItem("invoice-terms-draft") || "",
    footer: localStorage.getItem("invoice-footer-draft") || "",
  };
};

function defaultPaymentMethod(initialInvoice) {
  const fallback = {
    type: "bank_transfer",
    bank: {
      name: "",
      accountName: "",
      accountNumber: "",
    },
    ewallet: {
      provider: "",
      accountName: "",
      phoneNumber: "",
    },
  };

  const source = initialInvoice?.paymentMethod;
  if (!source) {
    return fallback;
  }

  return {
    type: source.type === "e_wallet" ? "e_wallet" : "bank_transfer",
    bank: {
      name: source.bank?.name || "",
      accountName: source.bank?.accountName || "",
      accountNumber: source.bank?.accountNumber || "",
    },
    ewallet: {
      provider: source.ewallet?.provider || "",
      accountName: source.ewallet?.accountName || "",
      phoneNumber: source.ewallet?.phoneNumber || "",
    },
  };
}

function defaultFormState(initialInvoice) {
  const now = new Date();
  const defaultInvoiceDate = initialInvoice?.invoiceDate || now;
  const defaultDueDate = initialInvoice?.dueDate || addDays(now, 2);

  return {
    invoiceNumber:
      initialInvoice?.invoiceNumber ||
      generateInvoiceNumber(defaultInvoiceDate),
    invoiceDate: formatDateForInput(defaultInvoiceDate),
    dueDate: formatDateForInput(defaultDueDate),
    status: initialInvoice?.status || "draft",
    billedBy: {
      name: initialInvoice?.billedBy?.name || "",
      email: initialInvoice?.billedBy?.email || "",
      phone: initialInvoice?.billedBy?.phone || "",
      company: initialInvoice?.billedBy?.company || "",
      address: initialInvoice?.billedBy?.address || "",
    },
    billedTo: {
      clientId: initialInvoice?.billedTo?.clientId || "",
      name: initialInvoice?.billedTo?.name || "",
      email: initialInvoice?.billedTo?.email || "",
      phone: initialInvoice?.billedTo?.phone || "",
      company: initialInvoice?.billedTo?.company || "",
      address: initialInvoice?.billedTo?.address || "",
    },
    terms: initialInvoice?.terms || "",
    footer: initialInvoice?.footer || "",
    currency: initialInvoice?.currency || "IDR",
    paymentMethod: defaultPaymentMethod(initialInvoice),
  };
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export default function InvoiceForm({
  mode = "create",
  initialInvoice = null,
  invoiceId = null,
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const base = defaultFormState(initialInvoice);
    if (!initialInvoice && mode === "create") {
      const draft = loadDraftContent();
      base.terms = base.terms || draft.terms;
      base.footer = base.footer || draft.footer;
    }
    return base;
  });
  const [logo, setLogo] = useState(initialInvoice?.logo || "");
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [items, setItems] = useState(() =>
    mapItemsToState(
      initialInvoice?.items || [],
      initialInvoice?.currency || "IDR"
    )
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [billedByLocked, setBilledByLocked] = useState(true);

  const isEditing = mode === "edit" && Boolean(invoiceId);
  const isCreateDraft = mode === "create" && !initialInvoice;

  const parseCurrencyInput = useCallback(
    (value) => parseCurrencyString(value),
    []
  );

  const totals = useMemo(() => {
    const normalized = items.map((item) => {
      const priceNumber = parseCurrencyInput(item.price);
      const quantity = Number(item.quantity) || 1;
      return {
        ...item,
        price: priceNumber,
        subtotal:
          Number.isFinite(item.subtotal) && item.subtotal !== null
            ? item.subtotal
            : quantity * priceNumber,
      };
    });
    return calculateInvoiceTotals(normalized);
  }, [items, parseCurrencyInput]);

  const paymentMethodState = useMemo(() => {
    const clean = (value) => (value ?? "").toString().trim();
    const type =
      form.paymentMethod?.type === "e_wallet" ? "e_wallet" : "bank_transfer";

    return {
      type,
      bank: {
        name: clean(form.paymentMethod?.bank?.name),
        accountName: clean(form.paymentMethod?.bank?.accountName),
        accountNumber: clean(form.paymentMethod?.bank?.accountNumber),
      },
      ewallet: {
        provider: clean(form.paymentMethod?.ewallet?.provider),
        accountName: clean(form.paymentMethod?.ewallet?.accountName),
        phoneNumber: clean(form.paymentMethod?.ewallet?.phoneNumber),
      },
    };
  }, [form.paymentMethod]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        fetch("/api/clients", {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }),
        fetch("/api/services", {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }),
      ]);

      const clientsData = await clientsRes.json();
      const servicesData = await servicesRes.json();

      if (clientsData.success) {
        setClients(clientsData.data.clients || []);
      } else {
        toast.error(clientsData.message || "Failed to load clients");
      }

      if (servicesData.success) {
        setServices(servicesData.data.services || []);
      } else {
        toast.error(servicesData.message || "Failed to load services");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load initial data");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw);
      setForm((prev) => ({
        ...prev,
        billedBy: {
          ...prev.billedBy,
          name: prev.billedBy.name || user.fullName || user.name || "",
          email: prev.billedBy.email || user.email || "",
          phone: prev.billedBy.phone || user.phone || user.phoneNumber || "",
        },
      }));
    } catch (error) {
      console.error("Failed to hydrate billed by", error);
    }
  }, [initialInvoice, mode]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!initialInvoice) return;
    setForm(defaultFormState(initialInvoice));
    setLogo(initialInvoice.logo || "");
    const nextCurrency = initialInvoice.currency || "IDR";
    setItems(mapItemsToState(initialInvoice.items || [], nextCurrency));
  }, [initialInvoice]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (isCreateDraft) {
        if (field === "terms") {
          localStorage.setItem("invoice-terms-draft", value || "");
        }
        if (field === "footer") {
          localStorage.setItem("invoice-footer-draft", value || "");
        }
      }

      return next;
    });
  };

  const handleBilledByChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billedBy: {
        ...prev.billedBy,
        [field]: value,
      },
    }));
  };

  const handleBilledToChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billedTo: {
        ...prev.billedTo,
        [field]: value,
      },
    }));
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(
      (c) => c.clientId === clientId || c.id === clientId || c._id === clientId
    );
    if (!client) {
      handleBilledToChange("clientId", "");
      return;
    }
    handleBilledToChange("clientId", client.clientId || client.id || "");
    handleBilledToChange("name", client.clientName || "");
    handleBilledToChange("company", client.companyName || "");
    handleBilledToChange("email", client.email || "");
    handleBilledToChange("phone", client.phoneNumber || "");
    handleBilledToChange("address", client.address || "");
  };

  const handlePaymentMethodTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        type,
      },
    }));
  };

  const handlePaymentDetailsChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        [section]: {
          ...(prev.paymentMethod?.[section] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleAddService = () => {
    if (!selectedServiceId) {
      toast.error("Please select a service first");
      return;
    }
    const service = services.find(
      (s) =>
        s.id === selectedServiceId ||
        s._id === selectedServiceId ||
        s.serviceId === selectedServiceId
    );
    if (!service) {
      toast.error("Service not found");
      return;
    }

    const identifier = service.serviceId || service.id || service._id;
    const exists = items.some((item) => item.serviceId === identifier);
    if (exists) {
      toast.error("Service already added");
      return;
    }

    const basePrice = Number(service.servicePrice) || 0;

    setItems((prev) => [
      ...prev,
      {
        serviceId: identifier,
        serviceName: service.serviceName,
        deliverables: service.deliverables || "",
        quantity: 1,
        price: formatCurrency(basePrice, form.currency),
        subtotal: basePrice,
      },
    ]);

    setSelectedServiceId("");
  };

  const normalizeCurrencyInput = (value) => {
    if (value === "") return "";
    const numeric = value.toString().replace(/[^0-9]/g, "");
    const numberValue = parseInt(numeric, 10) || 0;
    return formatCurrency(numberValue, form.currency);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index] };
      if (field === "quantity") {
        const qty = Math.max(1, Number(value) || 1);
        target.quantity = qty;
        const priceValue = parseCurrencyInput(target.price);
        target.subtotal = qty * priceValue;
      } else if (field === "price") {
        target.price = normalizeCurrencyInput(value);
        const priceValue = parseCurrencyInput(target.price);
        target.subtotal = priceValue * (target.quantity || 0);
      }
      next[index] = target;
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_MB) {
      toast.error("Logo size exceeds 900KB limit");
      return;
    }
    try {
      const base64 = await toBase64(file);
      setLogo(base64);
    } catch (error) {
      toast.error("Failed to read logo file");
    }
  };

  const handleLogoRemove = () => {
    setLogo("");
  };

  const buildPayload = () => {
    const invoiceDate = new Date(form.invoiceDate);
    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(invoiceDate.getTime())) {
      throw new Error("Invalid invoice date");
    }
    if (Number.isNaN(dueDate.getTime())) {
      throw new Error("Invalid due date");
    }
    if (!items.length) {
      throw new Error("Please add at least one service");
    }
    if (!form.billedTo.name && !form.billedTo.company) {
      throw new Error("Please select a client to bill");
    }

    const sanitizedItems = items.map((item) => {
      const price = parseCurrencyInput(item.price);
      const quantity = Number(item.quantity) || 1;

      return {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        deliverables: item.deliverables || "",
        quantity,
        price,
        subtotal: quantity * price,
      };
    });

    const { subtotal, total } = calculateInvoiceTotals(sanitizedItems);

    return {
      invoiceNumber: form.invoiceNumber,
      invoiceDate,
      dueDate,
      status: form.status,
      billedBy: form.billedBy,
      billedTo: form.billedTo,
      items: sanitizedItems,
      terms: form.terms,
      footer: form.footer,
      logo,
      paymentMethod: paymentMethodState,
      subtotal,
      total,
      currency: form.currency,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = buildPayload();

      const url = isEditing ? `/api/invoices/${invoiceId}` : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to save invoice");
        return;
      }

      toast.success(
        isEditing
          ? "Invoice updated successfully"
          : "Invoice created successfully"
      );

      if (isCreateDraft) {
        localStorage.removeItem("invoice-terms-draft");
        localStorage.removeItem("invoice-footer-draft");
      }
      router.push(`/dashboard/invoices/${data.data.invoice.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const previewData = useMemo(() => {
    const normalizedItems = items.map((item) => ({
      ...item,
      price: parseCurrencyInput(item.price),
      subtotal: (Number(item.quantity) || 1) * parseCurrencyInput(item.price),
    }));

    const { subtotal, total } = calculateInvoiceTotals(normalizedItems);
    return {
      ...form,
      paymentMethod: paymentMethodState,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      logo,
      items: normalizedItems,
      subtotal,
      total,
    };
  }, [form, items, logo, parseCurrencyInput, paymentMethodState]);

  if (fetching) {
    return (
      <div className="content-body">
        <div className="content-card" style={{ padding: "32px" }}>
          <p>Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="content-card">
        <div
          className="card-header"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn btn-back"
              type="button"
              onClick={() => router.back()}
            >
              <i className="uil uil-arrow-left"></i>
            </button>
            <div>
              <h2 className="card-title">
                {isEditing ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <p className="card-subtitle">
                Fill out the invoice details below
              </p>
            </div>
          </div>
          <InvoiceStatusBadge status={form.status} />
        </div>

        <form
          className="card-body"
          style={{ padding: "16px" }}
          onSubmit={handleSubmit}
        >
          <div className="invoice-form-grid">
            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                className="form-control"
                value={form.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
              />
              <small className="information-text">
                <i className="uil uil-info-circle"></i> Auto-generated, but you
                can customize if needed.
              </small>
            </div>

            <div className="form-group">
              <label>Status</label>
              <div className="select-wrapper">
                <select
                  className="form-control"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <i
                  className="uil uil-angle-down select-icon"
                  aria-hidden="true"
                ></i>
              </div>
            </div>

            <div className="form-group">
              <label>Invoice Date</label>
              <input
                type="date"
                className="form-control"
                value={form.invoiceDate}
                onChange={(e) => handleChange("invoiceDate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="form-control"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Company Branding
            </h3>
            <div className="invoice-logo-upload" style={{ marginTop: "12px" }}>
              {logo ? (
                <>
                  <img src={logo} alt="Invoice logo preview" />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <label className="btn btn-secondary">
                      <i className="uil uil-upload"></i>
                      Change Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleLogoRemove}
                    >
                      <i className="uil uil-times"></i>
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <i
                    className="uil uil-image-upload"
                    style={{ fontSize: "32px", color: "#9ca3af" }}
                  ></i>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Upload your company logo (max 900KB)
                  </p>
                  <label className="btn btn-secondary">
                    <i className="uil uil-upload"></i>
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Billed By
            </h3>
            <div className="invoice-form-grid" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.billedBy.name}
                  onChange={(e) => handleBilledByChange("name", e.target.value)}
                  disabled={billedByLocked}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.billedBy.email}
                  onChange={(e) =>
                    handleBilledByChange("email", e.target.value)
                  }
                  disabled={billedByLocked}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.billedBy.phone}
                  onChange={(e) =>
                    handleBilledByChange("phone", e.target.value)
                  }
                  disabled={billedByLocked}
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.billedBy.company}
                  onChange={(e) =>
                    handleBilledByChange("company", e.target.value)
                  }
                />
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label>Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.billedBy.address}
                  onChange={(e) =>
                    handleBilledByChange("address", e.target.value)
                  }
                ></textarea>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-warning"
              style={{
                marginTop: "8px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={() => setBilledByLocked((prev) => !prev)}
            >
              <i
                className={`uil ${billedByLocked ? "uil-lock" : "uil-unlock"}`}
              ></i>
              {billedByLocked ? "Unlock fields" : "Lock fields"}
            </button>
          </div>

          <div style={{ marginTop: "32px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Billed To
            </h3>
            <div className="invoice-form-grid" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Select Client</label>
                <div className="select-wrapper">
                  <select
                    className="form-control"
                    value={form.billedTo.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option
                        key={client._id}
                        value={client.clientId || client.id}
                      >
                        {client.clientName}
                      </option>
                    ))}
                  </select>
                  <i
                    className="uil uil-angle-down select-icon"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.billedTo.email}
                  onChange={(e) =>
                    handleBilledToChange("email", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.billedTo.phone}
                  onChange={(e) =>
                    handleBilledToChange("phone", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.billedTo.company}
                  onChange={(e) =>
                    handleBilledToChange("company", e.target.value)
                  }
                />
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label>Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.billedTo.address}
                  onChange={(e) =>
                    handleBilledToChange("address", e.target.value)
                  }
                ></textarea>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Invoice Items
            </h3>

            <div className="invoice-items-actions">
              <div className="select-wrapper" style={{ minWidth: "260px" }}>
                <select
                  className="form-control"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option
                      key={service._id}
                      value={service.serviceId || service.id}
                    >
                      {service.serviceName}
                    </option>
                  ))}
                </select>
                <i
                  className="uil uil-angle-down select-icon"
                  aria-hidden="true"
                ></i>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddService}
              >
                <i className="uil uil-plus"></i>
                Add Service
              </button>
            </div>

            {items.length > 0 ? (
              <div className="invoice-items-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Service ID</th>
                      <th>Service</th>
                      <th style={{ width: "100px" }}>Qty</th>
                      <th style={{ width: "140px" }}>Price</th>
                      <th style={{ width: "150px" }}>Subtotal</th>
                      <th style={{ width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.serviceId}-${idx}`}>
                        <td>{item.serviceId}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {item.serviceName}
                          </div>
                          {item.deliverables && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                marginTop: "4px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: item.deliverables,
                              }}
                            ></div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(idx, "price", e.target.value)
                            }
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatCurrency(item.subtotal, form.currency)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="action-btn delete"
                            style={{ border: "none" }}
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <i className="uil uil-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "16px",
                  padding: "24px",
                  border: "1px dashed var(--border-muted)",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                Select a service to add it to this invoice.
              </div>
            )}

            <div style={{ marginTop: "16px" }}>
              <div className="invoice-summary-card">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatCurrency(totals.subtotal, form.currency)}
                  </strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(totals.total, form.currency)}</strong>
                </div>
              </div>
            </div>
          </div>

        <div style={{ marginTop: "32px" }}>
          <h3 className="card-title" style={{ fontSize: "14px" }}>
            Payment Method
          </h3>
          <div className="invoice-form-grid" style={{ marginTop: "12px" }}>
            <div className="form-group">
              <label>Payment Method Type</label>
              <div className="select-wrapper">
                <select
                  className="form-control"
                  value={paymentMethodState.type}
                  onChange={(e) =>
                    handlePaymentMethodTypeChange(e.target.value)
                  }
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <i
                  className="uil uil-angle-down select-icon"
                  aria-hidden="true"
                ></i>
              </div>
            </div>
          </div>

          {paymentMethodState.type === "bank_transfer" && (
            <div className="invoice-form-grid" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Bank Name</label>
                <div className="select-wrapper">
                  <select
                    className="form-control"
                    value={form.paymentMethod?.bank?.name || ""}
                    onChange={(e) =>
                      handlePaymentDetailsChange("bank", "name", e.target.value)
                    }
                  >
                    <option value="">Select bank</option>
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  <i
                    className="uil uil-angle-down select-icon"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.paymentMethod?.bank?.accountName || ""}
                  onChange={(e) =>
                    handlePaymentDetailsChange("bank", "accountName", e.target.value)
                  }
                  placeholder="Enter account holder name"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-control"
                  value={form.paymentMethod?.bank?.accountNumber || ""}
                  onChange={(e) =>
                    handlePaymentDetailsChange(
                      "bank",
                      "accountNumber",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  placeholder="Enter account number"
                />
              </div>
            </div>
          )}

          {paymentMethodState.type === "e_wallet" && (
            <div className="invoice-form-grid" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>E-Wallet</label>
                <div className="select-wrapper">
                  <select
                    className="form-control"
                    value={form.paymentMethod?.ewallet?.provider || ""}
                    onChange={(e) =>
                      handlePaymentDetailsChange(
                        "ewallet",
                        "provider",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select e-wallet</option>
                    {EWALLET_OPTIONS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                  <i
                    className="uil uil-angle-down select-icon"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.paymentMethod?.ewallet?.accountName || ""}
                  onChange={(e) =>
                    handlePaymentDetailsChange(
                      "ewallet",
                      "accountName",
                      e.target.value
                    )
                  }
                  placeholder="Enter account name"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  inputMode="tel"
                  pattern="[0-9+]*"
                  className="form-control"
                  value={form.paymentMethod?.ewallet?.phoneNumber || ""}
                  onChange={(e) =>
                    handlePaymentDetailsChange(
                      "ewallet",
                      "phoneNumber",
                      e.target.value
                    )
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          )}
        </div>

          <div style={{ marginTop: "32px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Terms &amp; Conditions
            </h3>
            <ReactQuill
              value={form.terms}
              onChange={(value) => handleChange("terms", value)}
            />
          </div>

          <div style={{ marginTop: "32px" }}>
            <h3 className="card-title" style={{ fontSize: "14px" }}>
              Footer Notes
            </h3>
            <ReactQuill
              value={form.footer}
              onChange={(value) => handleChange("footer", value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "36px",
              gap: "16px",
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPreviewOpen(true)}
              disabled={loading}
            >
              <i className="uil uil-eye"></i>
              Preview
            </button>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Invoice"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {previewOpen && (
        <div className="invoice-preview-modal" role="dialog">
          <div className="invoice-preview-modal__content">
            <div className="modal-header">
              <h2 className="modal-title">Preview Invoice</h2>
              <button
                className="close"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <i className="uil uil-times"></i>
              </button>
            </div>
            <div className="modal-body invoice-preview-modal__body">
              <InvoicePreview invoice={previewData} showStatus />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
