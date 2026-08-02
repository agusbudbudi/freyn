"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input, { Textarea } from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge, { getStatusColors } from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const PROJECT_STATUS_FLOW = [
  { key: "to do", icon: "uil-clipboard-alt" },
  { key: "in progress", icon: "uil-spinner-alt" },
  { key: "waiting for payment", icon: "uil-wallet" },
  { key: "in review", icon: "uil-search" },
  { key: "revision", icon: "uil-refresh" },
  { key: "done", icon: "uil-check-circle" },
];

const STATUS_CLASS_MAP = {
  "to do": "status-todo",
  "in progress": "status-progress",
  "waiting for payment": "status-waiting",
  "in review": "status-review",
  revision: "status-revision",
  done: "status-done",
};

const STATUS_LABEL_MAP = {
  "to do": "To Do",
  "in progress": "In Progress",
  "waiting for payment": "Waiting for Payment",
  "in review": "In Review",
  revision: "Revision",
  done: "Done",
};

const getStatusClass = (status) => STATUS_CLASS_MAP[status] || "status-progress";
const getStatusLabel = (status) => STATUS_LABEL_MAP[status] || status;

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatCommentDate(dateString) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLogTimestamp(dateString) {
  if (!dateString) return "-";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatLogDetailValue(detail) {
  if (!detail) return "-";
  const { valueType, newValue } = detail;

  if (valueType === "currency") {
    const numericValue = Number(newValue || 0);
    return formatCurrency(Number.isNaN(numericValue) ? 0 : numericValue);
  }
  if (valueType === "number") {
    const numericValue = Number(newValue);
    return Number.isNaN(numericValue) ? "-" : String(numericValue);
  }
  if (valueType === "datetime") {
    return formatLogTimestamp(newValue);
  }
  if (typeof newValue === "string") {
    return newValue.trim() === "" ? "-" : newValue.trim();
  }
  return newValue ?? "-";
}

function generateAvatar(name, email) {
  if (!name)
    return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=default`;
  const seed = email || name;
  return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=${encodeURIComponent(
    seed
  )}`;
}

export default function ProjectForm({ mode = "create", initialProject = null }) {
  const router = useRouter();
  const isEditing = mode === "edit" && Boolean(initialProject);

  const [formData, setFormData] = useState({
    numberOrder: "",
    projectName: "",
    clientName: "",
    clientPhone: "",
    deadline: "",
    brief: "",
    price: 0,
    quantity: 1,
    discount: 0,
    totalPrice: 0,
    deliverables: "",
    invoice: "",
    serviceId: "",
    status: "to do",
  });

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("comment");
  const [projectDetails, setProjectDetails] = useState(initialProject);

  const linkedInvoiceId = (initialProject?.linkedInvoiceId || "").toString().trim();
  const hasLinkedInvoice = Boolean(linkedInvoiceId);
  const linkedInvoiceNumber = initialProject?.linkedInvoiceNumber || "";
  const canNavigateInvoice = Boolean(initialProject?._id);
  const invoiceDisplayNumber = linkedInvoiceNumber || linkedInvoiceId;

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const generateProjectNumber = useCallback(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    const existingNumbers = new Set(
      (projects || []).map((p) => p.numberOrder).filter(Boolean)
    );

    for (let attempt = 0; attempt < 20; attempt++) {
      const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
      const candidate = `FM-${dateStr}-${randomSuffix}`;
      if (!existingNumbers.has(candidate)) {
        return candidate;
      }
    }

    const fallbackSuffix = String(Date.now()).slice(-5).padStart(5, "0");
    return `FM-${dateStr}-${fallbackSuffix}`;
  }, [projects]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients", {
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (data.success) setClients(data.data.clients);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, [getAuthHeaders]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch("/api/services", {
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (data.success) {
        setServices(
          (data.data?.services || []).filter((s) => s.status === "active")
        );
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  }, [getAuthHeaders]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", {
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (data.success) setProjects(data.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchClients();
    fetchServices();
    if (!isEditing) fetchProjects();
  }, [fetchClients, fetchServices, fetchProjects, isEditing]);

  // Normalize serviceId loaded from existing project to match option values (String(_id))
  useEffect(() => {
    if (!isEditing) return;
    if (!formData.serviceId) return;
    if (!services || services.length === 0) return;

    const matchByObjectId = services.find(
      (s) => String(s._id) === formData.serviceId
    );
    if (matchByObjectId) return;

    const matchByCustomId = services.find((s) => s.id === formData.serviceId);
    if (matchByCustomId) {
      setFormData((prev) => ({
        ...prev,
        serviceId: String(matchByCustomId._id),
      }));
    }
  }, [services, formData.serviceId, isEditing]);

  // Populate form if editing or generate new numberOrder
  useEffect(() => {
    if (isEditing) {
      setFormData({
        numberOrder: initialProject.numberOrder || "",
        projectName: initialProject.projectName || "",
        clientName: initialProject.clientName || "",
        clientPhone: initialProject.clientPhone || "",
        deadline: initialProject.deadline
          ? toDatetimeLocal(initialProject.deadline)
          : "",
        brief: initialProject.brief || "",
        price: initialProject.price || 0,
        quantity: initialProject.quantity || 1,
        discount: initialProject.discount || 0,
        totalPrice: initialProject.totalPrice || 0,
        deliverables: initialProject.deliverables || "",
        invoice: initialProject.invoice || "",
        serviceId: initialProject.serviceId
          ? String(initialProject.serviceId)
          : "",
        status: initialProject.status || "to do",
      });
      setProjectDetails(initialProject);
    } else {
      setFormData((prev) => ({
        ...prev,
        numberOrder: generateProjectNumber(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Calculate total price
  useEffect(() => {
    const price = parseFloat(formData.price) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    const discount = parseFloat(formData.discount) || 0;
    const total = price * quantity - discount;
    setFormData((prev) => ({ ...prev, totalPrice: Math.max(0, total) }));
  }, [formData.price, formData.quantity, formData.discount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "serviceId") {
      const selected = services.find(
        (s) => String(s._id) === value || s.id === value
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          serviceId: value,
          price: selected.servicePrice,
        }));
      } else {
        setFormData((prev) => ({ ...prev, serviceId: "" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "clientName") {
      const selectedClient = clients.find((c) => c.clientName === value);
      if (selectedClient) {
        setFormData((prev) => ({
          ...prev,
          clientPhone: selectedClient.phoneNumber || "",
        }));
      }
    }
  };

  const handleBriefChange = (value) => {
    setFormData((prev) => ({ ...prev, brief: value }));
  };

  const handleInvoiceNavigation = () => {
    if (!canNavigateInvoice) {
      toast.error("Please save the project before creating an invoice");
      return;
    }

    const targetUrl = hasLinkedInvoice
      ? `/dashboard/invoices/${linkedInvoiceId}`
      : `/dashboard/invoices/add?projectId=${initialProject._id}`;

    router.push(targetUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/projects/${initialProject._id}`
        : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const priceNum = parseFloat(formData.price) || 0;
      const qtyNum = parseInt(formData.quantity) || 1;
      const discNum = parseFloat(formData.discount) || 0;
      const submitTotal = Math.max(0, priceNum * qtyNum - discNum);

      const normalizedServiceId = (() => {
        if (!formData.serviceId) return "";
        const svc = services.find(
          (s) =>
            String(s._id) === formData.serviceId || s.id === formData.serviceId
        );
        return svc ? String(svc._id) : formData.serviceId;
      })();

      const isoDeadline = formData.deadline
        ? new Date(formData.deadline).toISOString()
        : "";

      const payload = {
        ...formData,
        serviceId: normalizedServiceId,
        price: priceNum,
        quantity: qtyNum,
        discount: discNum,
        totalPrice: submitTotal,
        deadline: isoDeadline,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Project saved successfully");
        router.back();
      } else {
        toast.error(data.message || "Failed to save project");
        setError(data.message || "Failed to save project");
      }
    } catch (err) {
      setError("Failed to save project. Please try again.");
      toast.error("Failed to save project. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (!isEditing) {
      toast.error("Please save the project first before adding comments");
      return;
    }

    setSubmittingComment(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const commentData = {
        content: commentContent,
        authorName: user.fullName || "Admin",
        authorEmail: user.email || "admin@example.com",
        isClient: false,
      };

      const response = await fetch(
        `/api/projects/${initialProject._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(commentData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCommentContent("");
        toast.success("Comment added successfully");
        if (data.data?.project) {
          setProjectDetails(data.data.project);
        }
      } else {
        toast.error("Failed to add comment: " + data.message);
      }
    } catch (err) {
      toast.error("Failed to add comment. Please try again.");
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const sortedLogs = useMemo(() => {
    const sourceLogs = projectDetails?.logs || initialProject?.logs;
    if (!Array.isArray(sourceLogs)) return [];
    return [...sourceLogs].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [projectDetails?.logs, initialProject?.logs]);

  const currentStatusKey = (formData.status || "").toLowerCase();
  const statusFieldColors = getStatusColors(getStatusClass(currentStatusKey));

  const currentStatusIndex = useMemo(() => {
    const index = PROJECT_STATUS_FLOW.findIndex(
      (step) => step.key === currentStatusKey
    );
    return index >= 0 ? index : 0;
  }, [currentStatusKey]);

  const statusTimeline = useMemo(
    () =>
      PROJECT_STATUS_FLOW.map((step, index) => ({
        ...step,
        label: getStatusLabel(step.key),
        state:
          index < currentStatusIndex
            ? "completed"
            : index === currentStatusIndex
              ? "current"
              : "upcoming",
      })),
    [currentStatusIndex]
  );

  const statusProgressRatio =
    PROJECT_STATUS_FLOW.length <= 1
      ? 0
      : Math.min(Math.max(currentStatusIndex, 0), PROJECT_STATUS_FLOW.length - 1) /
      (PROJECT_STATUS_FLOW.length - 1);

  // Each step occupies an equal flex-1 slot, so a dot's center sits at the
  // slot's midpoint, not at the row edge. Inset the connector line by half a
  // slot on each side so it lines up with the first/last dot centers.
  const stepInsetPercent =
    PROJECT_STATUS_FLOW.length > 0 ? 100 / (2 * PROJECT_STATUS_FLOW.length) : 0;

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-2">
            <i className="uil uil-exclamation-triangle"></i> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          {/* Main Content */}
          <div className="flex flex-col gap-4 min-w-0">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <BackButton onClick={() => router.back()} />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 m-0">
                    {isEditing ? "Edit Project" : "Add New Project"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 mb-0">
                    Fill out the project details below
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="mt-5 pt-4 border-0 border-t border-solid border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <i className="uil uil-pathfinder"></i>
                      <span>Project Progress</span>
                    </div>
                    <StatusBadge
                      status={getStatusClass(currentStatusKey)}
                      className="px-3 py-1 text-xs gap-1.5"
                    >
                      {getStatusLabel(currentStatusKey)}
                    </StatusBadge>
                  </div>
                  <div className="relative flex justify-between">
                    <div
                      className="absolute top-4 h-0.5 bg-slate-200"
                      style={{
                        left: `${stepInsetPercent}%`,
                        right: `${stepInsetPercent}%`,
                      }}
                    />
                    <div
                      className="absolute top-4 h-0.5 bg-signal-blue transition-all duration-300"
                      style={{
                        left: `${stepInsetPercent}%`,
                        width: `${statusProgressRatio * (100 - stepInsetPercent * 2)}%`,
                      }}
                    />
                    {statusTimeline.map((step) => (
                      <div
                        key={step.key}
                        className="relative z-10 flex flex-col items-center gap-1.5 flex-1 px-1"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step.state === "completed"
                            ? "bg-signal-blue text-white"
                            : step.state === "current"
                              ? "bg-white border-2 border-solid border-signal-blue text-signal-blue"
                              : "bg-slate-100 text-slate-400 border border-solid border-slate-200"
                            }`}
                        >
                          <i className={`uil ${step.icon}`}></i>
                        </div>
                        <span className="text-[10px] text-center text-slate-500 leading-tight">
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Project Information
              </h3>
              <FormField label="Project Name *">
                <Input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter project name"
                />
              </FormField>
              <FormField label="Project Brief" className="mt-4">
                <ReactQuill
                  theme="snow"
                  value={formData.brief}
                  onChange={handleBriefChange}
                  modules={modules}
                  placeholder="Describe your project requirements..."
                />
              </FormField>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Pricing
              </h3>
              <FormField label="Service (optional)">
                <Select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                >
                  <option value="">Select service</option>
                  {services.map((s) => (
                    <option key={String(s._id)} value={String(s._id)}>
                      {s.serviceName}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mt-4">
                <FormField label="Price (Rp) *">
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Quantity *">
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </FormField>
                <FormField label="Discount (Rp)">
                  <Input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Total Price">
                  <Input
                    type="text"
                    value={formatCurrency(formData.totalPrice)}
                    readOnly
                    disabled
                  />
                </FormField>
              </div>
            </Card>

            {isEditing && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Deliverables
                </h3>
                <FormField label="Deliverables Link">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      name="deliverables"
                      value={formData.deliverables}
                      onChange={handleInputChange}
                      placeholder="https://drive.google.com/..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        window.open(`/result/${initialProject._id}`, "_blank")
                      }
                    >
                      <i className="uil uil-external-link-alt"></i>
                      Open Result
                    </Button>
                  </div>
                </FormField>
                <FormField label="Invoice" className="mt-4">
                  {hasLinkedInvoice ? (
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px] bg-blue-50 text-blue-900 rounded-lg px-4 py-3 text-[13px] font-medium leading-normal">
                        Your invoice has already been generated
                        <strong className="ml-1">
                          #{invoiceDisplayNumber}
                        </strong>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleInvoiceNavigation}
                        disabled={!canNavigateInvoice}
                      >
                        <i className="uil uil-external-link-alt"></i>
                        Open Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        name="invoice"
                        value={formData.invoice}
                        onChange={handleInputChange}
                        placeholder="https://splitbill-alpha.vercel.app/..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleInvoiceNavigation}
                        disabled={!canNavigateInvoice}
                      >
                        <i className="uil uil-file-plus"></i>
                        Create Invoice
                      </Button>
                    </div>
                  )}
                </FormField>
              </Card>
            )}

            {isEditing && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Activity
                </h3>

                <Tabs
                    tabs={[
                      { value: "comment", label: "Comments" },
                      { value: "history", label: "History" },
                    ]}
                    value={activeDetailTab}
                    onChange={setActiveDetailTab}
                    className="mb-4"
                  />

                  {activeDetailTab === "comment" ? (
                    <>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <i className="uil uil-info-circle"></i> Internal
                        Comment only can be seen by you.
                      </p>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          rows="3"
                          placeholder="Add a comment or note about this project..."
                          className="flex-1 resize-y"
                        />
                        <Button
                          type="button"
                          onClick={handleSubmitComment}
                          disabled={submittingComment}
                          className="h-fit"
                        >
                          <i className="uil uil-message"></i>
                        </Button>
                      </div>

                      <div className="flex flex-col gap-4 mt-5">
                        {(() => {
                          const commentSource =
                            projectDetails?.comments || initialProject?.comments;
                          if (
                            !Array.isArray(commentSource) ||
                            commentSource.length === 0
                          ) {
                            return (
                              <div className="text-center py-4 text-slate-400">
                                <i className="uil uil-comment-dots text-3xl mb-2 block"></i>
                                <p className="text-sm m-0">
                                  No comments yet. Be the first to add one!
                                </p>
                              </div>
                            );
                          }

                          return commentSource
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt || 0) -
                                new Date(a.createdAt || 0)
                            )
                            .map((comment, index) => (
                              <div
                                key={comment.id || comment.createdAt || index}
                                className="flex gap-3"
                              >
                                <Image
                                  src={generateAvatar(
                                    comment.authorName,
                                    comment.authorEmail
                                  )}
                                  alt={comment.authorName || "Comment author"}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full shrink-0"
                                  unoptimized
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold text-slate-900">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatCommentDate(comment.createdAt)}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${comment.isClient
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                      {comment.isClient ? "Client" : "Team"}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    {comment.content}
                                  </div>
                                </div>
                              </div>
                            ));
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {sortedLogs.length > 0 ? (
                        sortedLogs.map((log) => {
                          const actorName = log.actorName || "Unknown user";
                          const logKey = log.id || log._id || log.createdAt;

                          return (
                            <div key={logKey} className="flex gap-3">
                              <Image
                                src={generateAvatar(
                                  log.actorName,
                                  log.actorEmail
                                )}
                                alt={actorName}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full shrink-0"
                                unoptimized
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-slate-900">
                                  {log.message}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {formatLogTimestamp(log.createdAt)} by{" "}
                                  {actorName}
                                </div>
                                {log.type === "project_edit" &&
                                  Array.isArray(log.details) &&
                                  log.details.length > 0 && (
                                    <ul className="mt-2 pl-4 list-disc text-xs text-slate-600 flex flex-col gap-1">
                                      {log.details.map((detail, index) => (
                                        <li
                                          key={`${logKey}-${detail.field || index
                                            }`}
                                        >
                                          <span className="font-medium text-slate-700">
                                            {detail.label}
                                          </span>{" "}
                                          changed to{" "}
                                          <span className="font-medium text-slate-900">
                                            {formatLogDetailValue(detail)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-slate-400">
                          <i className="uil uil-history text-3xl mb-2 block"></i>
                          <p className="text-sm m-0">No log history yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>

          {/* Sidebar */}
          <Card className="p-4 lg:sticky lg:top-[78px]">
            <div className="flex flex-col gap-4">
              <FormField label="Order Number">
                <Input value={formData.numberOrder} readOnly disabled />
              </FormField>

              <FormField label="Status">
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="font-medium capitalize"
                  style={{
                    backgroundColor: statusFieldColors.bg,
                    color: statusFieldColors.text,
                    borderColor: "transparent",
                  }}
                >
                  <option value="to do">To Do</option>
                  <option value="in progress">In Progress</option>
                  <option value="waiting for payment">
                    Waiting for Payment
                  </option>
                  <option value="in review">In Review</option>
                  <option value="revision">Revision</option>
                  <option value="done">Done</option>
                </Select>
              </FormField>

              <FormField label="Client Name *">
                <Select
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.clientName}>
                      {client.clientName}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Client Phone">
                <Input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </FormField>

              <FormField label="Due Date *">
                <Input
                  type="datetime-local"
                  name="deadline"
                  step="60"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
              </FormField>

              <div className="flex flex-col gap-2 pt-2 border-0 border-t border-solid border-slate-100">
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                  <i className="uil uil-save"></i>
                  {loading ? "Saving..." : "Save Project"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
