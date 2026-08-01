"use client";

import Image from "next/image";
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
import { Card, CardBody } from "@/components/ui/Card";
import Button, { buttonClasses } from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input, { Textarea } from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ActionButton from "@/components/ui/ActionButton";

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
  projectId: projectIdProp = null,
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
  const [linkedProjectId, setLinkedProjectId] = useState(
    initialInvoice?.projectId || projectIdProp || ""
  );
  const [projectPrefill, setProjectPrefill] = useState(null);
  const [projectLoading, setProjectLoading] = useState(Boolean(projectIdProp));
  const [prefillApplied, setPrefillApplied] = useState(false);

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

  const handleBilledToChange = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      billedTo: {
        ...prev.billedTo,
        [field]: value,
      },
    }));
  }, []);

  const handleClientSelect = useCallback(
    (clientId) => {
      if (!clientId) {
        handleBilledToChange("clientId", "");
        return;
      }

      const targetId = clientId.toString();
      const client = clients.find((c) => {
        const identifiers = [c.clientId, c.id, c._id?.toString?.()]
          .filter(Boolean)
          .map((value) => value.toString());
        return identifiers.includes(targetId);
      });
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
    },
    [clients, handleBilledToChange]
  );

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
    setLinkedProjectId(
      initialInvoice?.projectId || projectIdProp || ""
    );
  }, [initialInvoice, projectIdProp]);

  useEffect(() => {
    if (!projectIdProp) {
      setProjectPrefill(null);
      setProjectLoading(false);
      return;
    }

    let cancelled = false;
    const loadProject = async () => {
      setProjectLoading(true);
      setPrefillApplied(false);
      try {
        const response = await fetch(`/api/projects/${projectIdProp}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.success) {
          setProjectPrefill(data.data?.project || null);
        } else {
          setProjectPrefill(null);
          toast.error(data.message || "Failed to load project details");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setProjectPrefill(null);
          toast.error("Failed to load project details");
        }
      } finally {
        if (!cancelled) {
          setProjectLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectIdProp]);

  useEffect(() => {
    if (!projectIdProp) return;
    if (!projectPrefill) return;
    if (prefillApplied) return;
    if (fetching) return;

    const project = projectPrefill;
    const normalizedProjectId =
      project._id?.toString?.() || projectIdProp || "";

    if (normalizedProjectId) {
      setLinkedProjectId(normalizedProjectId);
    }

    const matchedClient = clients.find((client) => {
      const identifiers = [client.clientId, client.id, client._id?.toString?.()];
      return (
        (project.clientId && identifiers.includes(project.clientId)) ||
        client.clientName === project.clientName
      );
    });

    if (matchedClient) {
      const clientIdentifier =
        matchedClient.clientId ||
        matchedClient.id ||
        matchedClient._id?.toString?.() ||
        "";
      if (clientIdentifier) {
        handleClientSelect(clientIdentifier);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        billedTo: {
          ...prev.billedTo,
          clientId: project.clientId || prev.billedTo.clientId,
          name: project.clientName || prev.billedTo.name,
          company: project.clientCompany || prev.billedTo.company,
          email: project.clientEmail || prev.billedTo.email,
          phone: project.clientPhone || prev.billedTo.phone,
          address: project.clientAddress || prev.billedTo.address,
        },
      }));
    }

    if (!items.length) {
      const service = services.find((svc) => {
        const svcIdentifiers = [
          svc._id?.toString?.(),
          svc.id,
          svc.serviceId,
        ];
        return project.serviceId && svcIdentifiers.includes(project.serviceId);
      });

      const identifier =
        service?.serviceId ||
        service?.id ||
        service?._id?.toString?.() ||
        project.serviceId ||
        `project-${normalizedProjectId}`;

      const quantity = Math.max(1, Number(project.quantity) || 1);
      const basePrice = Number(project.price) || Number(service?.servicePrice) || 0;
      let totalAmount = Number(project.totalPrice);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        totalAmount = quantity * basePrice;
      }
      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        totalAmount = 0;
      }
      const pricePerUnit = quantity > 0 ? totalAmount / quantity : totalAmount;

      const item = {
        serviceId: String(identifier),
        serviceName: service?.serviceName || project.projectName || "Service",
        deliverables: project.deliverables || service?.deliverables || "",
        quantity,
        price: pricePerUnit,
        subtotal: pricePerUnit * quantity,
      };

      const targetCurrency = project.currency || form.currency || "IDR";
      setItems(mapItemsToState([item], targetCurrency));
    }

    setPrefillApplied(true);
  }, [
    projectIdProp,
    projectPrefill,
    fetching,
    prefillApplied,
    clients,
    services,
    items.length,
    handleClientSelect,
    form.currency,
  ]);

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

    const payload = {
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

    if (linkedProjectId) {
      payload.projectId = linkedProjectId;
    }

    return payload;
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

  if (fetching || projectLoading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading invoice data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px] grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <Card>
        <div className="p-6 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => router.back()} />
            <div>
              <h2 className="text-base font-semibold text-slate-900 m-0">
                {isEditing ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Fill out the invoice details below
              </p>
            </div>
          </div>
          <InvoiceStatusBadge status={form.status} />
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            <FormField label="Invoice Number">
              <Input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
              />
              <small className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <i className="uil uil-info-circle"></i> Auto-generated, but you
                can customize if needed.
              </small>
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Invoice Date">
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => handleChange("invoiceDate", e.target.value)}
              />
            </FormField>

            <FormField label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </FormField>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Company Branding
            </h3>
            <div className="mt-3 border border-dashed border-[#e7e7e7] rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-slate-50 text-center">
              {logo ? (
                <>
                  <Image
                    src={logo}
                    alt="Invoice logo preview"
                    width={160}
                    height={120}
                    className="max-w-[160px] max-h-[120px] object-contain rounded-lg"
                    unoptimized
                  />
                  <div className="flex gap-3">
                    <label className={buttonClasses({ variant: "secondary", size: "sm" })}>
                      <i className="uil uil-upload"></i>
                      Change Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleLogoRemove}
                    >
                      <i className="uil uil-times"></i>
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <i className="uil uil-image-upload text-3xl text-gray-400"></i>
                  <p className="text-xs text-slate-500">
                    Upload your company logo (max 900KB)
                  </p>
                  <label className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    <i className="uil uil-upload"></i>
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Billed By
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-3">
              <FormField label="Name">
                <Input
                  type="text"
                  value={form.billedBy.name}
                  onChange={(e) => handleBilledByChange("name", e.target.value)}
                  disabled={billedByLocked}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={form.billedBy.email}
                  onChange={(e) =>
                    handleBilledByChange("email", e.target.value)
                  }
                  disabled={billedByLocked}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  type="text"
                  value={form.billedBy.phone}
                  onChange={(e) =>
                    handleBilledByChange("phone", e.target.value)
                  }
                  disabled={billedByLocked}
                />
              </FormField>
              <FormField label="Company">
                <Input
                  type="text"
                  value={form.billedBy.company}
                  onChange={(e) =>
                    handleBilledByChange("company", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={form.billedBy.address}
                  onChange={(e) =>
                    handleBilledByChange("address", e.target.value)
                  }
                ></Textarea>
              </FormField>
            </div>
            <Button
              type="button"
              variant="warning"
              size="sm"
              className="mt-2"
              onClick={() => setBilledByLocked((prev) => !prev)}
            >
              <i
                className={`uil ${billedByLocked ? "uil-lock" : "uil-unlock"}`}
              ></i>
              {billedByLocked ? "Unlock fields" : "Lock fields"}
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Billed To
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-3">
              <FormField label="Select Client">
                <Select
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
                </Select>
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={form.billedTo.email}
                  onChange={(e) =>
                    handleBilledToChange("email", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  type="text"
                  value={form.billedTo.phone}
                  onChange={(e) =>
                    handleBilledToChange("phone", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Company">
                <Input
                  type="text"
                  value={form.billedTo.company}
                  onChange={(e) =>
                    handleBilledToChange("company", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={form.billedTo.address}
                  onChange={(e) =>
                    handleBilledToChange("address", e.target.value)
                  }
                ></Textarea>
              </FormField>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Invoice Items
            </h3>

            <div className="flex justify-between items-center mt-4 gap-3 w-full sm:w-1/2 flex-wrap">
              <div className="min-w-[260px] flex-1">
                <Select
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
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={handleAddService}>
                <i className="uil uil-plus"></i>
                Add Service
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full border-collapse min-w-[680px]">
                  <thead>
                    <tr>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left">Service ID</th>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left">Service</th>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left w-[100px]">Qty</th>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left w-[140px]">Price</th>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left w-[150px]">Subtotal</th>
                      <th className="border-b border-slate-100 p-3 text-xs uppercase tracking-wide text-slate-500 bg-slate-100 text-left w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.serviceId}-${idx}`}>
                        <td className="border-b border-slate-100 p-3 text-xs">{item.serviceId}</td>
                        <td className="border-b border-slate-100 p-3 text-xs">
                          <div className="font-semibold">
                            {item.serviceName}
                          </div>
                          {item.deliverables && (
                            <div
                              className="text-[11px] text-slate-500 mt-1"
                              dangerouslySetInnerHTML={{
                                __html: item.deliverables,
                              }}
                            ></div>
                          )}
                        </td>
                        <td className="border-b border-slate-100 p-3 text-xs">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td className="border-b border-slate-100 p-3 text-xs">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(idx, "price", e.target.value)
                            }
                          />
                        </td>
                        <td className="border-b border-slate-100 p-3 text-xs text-right">
                          {formatCurrency(item.subtotal, form.currency)}
                        </td>
                        <td className="border-b border-slate-100 p-3 text-xs text-right">
                          <ActionButton
                            variant="delete"
                            icon="uil uil-trash-alt"
                            onClick={() => handleRemoveItem(idx)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 p-6 border border-dashed border-[#e7e7e7] rounded-xl text-center text-slate-500 text-xs">
                Select a service to add it to this invoice.
              </div>
            )}

            <div className="mt-4">
              <div className="bg-slate-100 rounded-xl p-4 flex flex-col gap-2 max-w-[340px] ml-auto">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Subtotal</span>
                  <strong className="text-slate-900">
                    {formatCurrency(totals.subtotal, form.currency)}
                  </strong>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Total</span>
                  <strong className="text-slate-900">{formatCurrency(totals.total, form.currency)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment Method
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-3">
              <FormField label="Payment Method Type">
                <Select
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
                </Select>
              </FormField>
            </div>

            {paymentMethodState.type === "bank_transfer" && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-3">
                <FormField label="Bank Name">
                  <Select
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
                  </Select>
                </FormField>
                <FormField label="Account Holder Name">
                  <Input
                    type="text"
                    value={form.paymentMethod?.bank?.accountName || ""}
                    onChange={(e) =>
                      handlePaymentDetailsChange("bank", "accountName", e.target.value)
                    }
                    placeholder="Enter account holder name"
                  />
                </FormField>
                <FormField label="Account Number">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                </FormField>
              </div>
            )}

            {paymentMethodState.type === "e_wallet" && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 mt-3">
                <FormField label="E-Wallet">
                  <Select
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
                  </Select>
                </FormField>
                <FormField label="Account Name">
                  <Input
                    type="text"
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
                </FormField>
                <FormField label="Phone Number">
                  <Input
                    type="text"
                    inputMode="tel"
                    pattern="[0-9+]*"
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
                </FormField>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Terms &amp; Conditions
            </h3>
            <ReactQuill
              value={form.terms}
              onChange={(value) => handleChange("terms", value)}
            />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">
              Footer Notes
            </h3>
            <ReactQuill
              value={form.footer}
              onChange={(value) => handleChange("footer", value)}
            />
          </div>

          <div className="flex justify-between mt-9 gap-4 flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="xl:hidden"
              onClick={() => setPreviewOpen(true)}
              disabled={loading}
            >
              <i className="uil uil-eye"></i>
              Preview
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Invoice"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="hidden xl:block sticky top-[86px] max-h-[calc(100vh-106px)] overflow-y-auto">
        <div className="invoice-preview-live relative rounded-2xl overflow-hidden">
          <span className="absolute top-0 right-0 rounded-bl-lg bg-signal-blue text-white text-[10px] font-semibold uppercase tracking-wide py-1 px-3 shadow-md z-10">
            Live Preview
          </span>
          <InvoicePreview invoice={previewData} showStatus />
        </div>
      </div>

      {previewOpen && (
        <Modal
          title="Preview Invoice"
          onClose={() => setPreviewOpen(false)}
          fullScreenOnMobile
        >
          <InvoicePreview invoice={previewData} showStatus />
        </Modal>
      )}
    </div>
  );
}
