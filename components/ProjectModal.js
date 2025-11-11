"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";

// Dynamic import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const PROJECT_STATUS_FLOW = [
  { key: "to do", icon: "uil-clipboard-alt" },
  { key: "in progress", icon: "uil-spinner-alt" },
  { key: "waiting for payment", icon: "uil-wallet" },
  { key: "in review", icon: "uil-search" },
  { key: "revision", icon: "uil-refresh" },
  { key: "done", icon: "uil-check-circle" },
];

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  editProject = null,
}) {
  const router = useRouter();
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
  const [closing, setClosing] = useState(false);
  const [projectDetails, setProjectDetails] = useState(editProject);
  const closeTimerRef = useRef(null);

  const linkedInvoiceId = (() => {
    const value = editProject?.linkedInvoiceId;
    if (!value) return "";
    return value.toString().trim();
  })();
  const hasLinkedInvoice = Boolean(linkedInvoiceId);
  const linkedInvoiceNumber = editProject?.linkedInvoiceNumber || "";
  const canNavigateInvoice = Boolean(editProject?._id);
  const invoiceDisplayNumber = linkedInvoiceNumber || linkedInvoiceId;
  const editProjectId = editProject?._id;

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  // Generate unique project number using random suffix to avoid cross-workspace collisions
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
      const randomSuffix = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
      const candidate = `FM-${dateStr}-${randomSuffix}`;
      if (!existingNumbers.has(candidate)) {
        return candidate;
      }
    }

    // Fallback: use timestamp-based suffix if random attempts fail
    const fallbackSuffix = String(Date.now()).slice(-5).padStart(5, "0");
    return `FM-${dateStr}-${fallbackSuffix}`;
  }, [projects]);

  // Normalize serviceId loaded from existing project to match option values (String(_id))
  useEffect(() => {
    if (!editProject) return;
    if (!formData.serviceId) return;
    if (!services || services.length === 0) return;

    // If current serviceId already matches an option value, do nothing
    const matchByObjectId = services.find(
      (s) => String(s._id) === formData.serviceId
    );
    if (matchByObjectId) return;

    // If current serviceId matches the custom Service.id, normalize it to String(_id)
    const matchByCustomId = services.find((s) => s.id === formData.serviceId);
    if (matchByCustomId) {
      setFormData((prev) => ({
        ...prev,
        serviceId: String(matchByCustomId._id),
      }));
    }
  }, [services, formData.serviceId, editProject]);

  // Reset closing state on open and cleanup timer on unmount
  useEffect(() => {
    if (isOpen) setClosing(false);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    setProjectDetails(editProject);
  }, [editProject]);

  useEffect(() => {
    if (!isOpen || !editProjectId) return;

    let isCancelled = false;

    const loadProjectDetails = async () => {
      try {
        const response = await fetch(`/api/projects/${editProjectId}`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!isCancelled && data.success) {
          setProjectDetails(data.data?.project || editProject);
        }
      } catch (err) {
        console.error("Failed to fetch project details:", err);
      }
    };

    loadProjectDetails();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, editProjectId, getAuthHeaders, editProject]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.data.clients);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, [getAuthHeaders]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch("/api/services", {
        headers: {
          ...getAuthHeaders(),
        },
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
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  }, [getAuthHeaders]);

  // Fetch clients and projects for dropdown
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProjects();
      fetchServices();
    }
  }, [isOpen, fetchClients, fetchProjects, fetchServices]);

  // Populate form if editing or generate new numberOrder
  useEffect(() => {
    if (editProject) {
      setFormData({
        numberOrder: editProject.numberOrder || "",
        projectName: editProject.projectName || "",
        clientName: editProject.clientName || "",
        clientPhone: editProject.clientPhone || "",
        deadline: editProject.deadline
          ? toDatetimeLocal(editProject.deadline)
          : "",
        brief: editProject.brief || "",
        price: editProject.price || 0,
        quantity: editProject.quantity || 1,
        discount: editProject.discount || 0,
        totalPrice: editProject.totalPrice || 0,
        deliverables: editProject.deliverables || "",
        invoice: editProject.invoice || "",
        serviceId: editProject.serviceId ? String(editProject.serviceId) : "",
        status: editProject.status || "to do",
      });
    } else if (isOpen) {
      const newNumberOrder = generateProjectNumber();
      setFormData({
        numberOrder: newNumberOrder,
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
    }
  }, [editProject, isOpen, generateProjectNumber]);

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

    // If selecting a service, prefill price while keeping it editable
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

    // Auto-fill client phone when client is selected
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
      : `/dashboard/invoices/add?projectId=${editProject._id}`;

    handleStartClose();
    router.push(targetUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editProject
        ? `/api/projects/${editProject._id}`
        : "/api/projects";
      const method = editProject ? "PUT" : "POST";

      // Ensure totalPrice is consistent at submit time
      const priceNum = parseFloat(formData.price) || 0;
      const qtyNum = parseInt(formData.quantity) || 1;
      const discNum = parseFloat(formData.discount) || 0;
      const submitTotal = Math.max(0, priceNum * qtyNum - discNum);

      // Normalize serviceId to String(_id) to ensure consistency with options/DB
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
        if (data.data?.project) {
          setProjectDetails(data.data.project);
        }
        onSave(data.data?.project);
        handleStartClose();
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

  // Convert any Date/string to "YYYY-MM-DDTHH:mm" in local time for <input type="datetime-local">
  const toDatetimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCommentDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLogTimestamp = (dateString) => {
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
  };

  const formatLogDetailValue = (detail) => {
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
  };

  // Status helpers to match list page badge colors/labels
  const getStatusClass = (status) => {
    const statusMap = {
      "to do": "status-todo",
      "in progress": "status-progress",
      "waiting for payment": "status-waiting",
      "in review": "status-review",
      revision: "status-revision",
      done: "status-done",
    };
    return statusMap[status] || "status-progress";
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      "to do": "To Do",
      "in progress": "In Progress",
      "waiting for payment": "Payment",
      "in review": "In Review",
      revision: "Revision",
      done: "Done",
    };
    return labelMap[status] || status;
  };

  const currentStatusKey = (formData.status || "").toLowerCase();

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

  const statusProgressRatio = useMemo(() => {
    if (PROJECT_STATUS_FLOW.length <= 1) {
      return 0;
    }
    const normalizedIndex = Math.min(
      Math.max(currentStatusIndex, 0),
      PROJECT_STATUS_FLOW.length - 1
    );
    return normalizedIndex / (PROJECT_STATUS_FLOW.length - 1);
  }, [currentStatusIndex]);

  const renderStatusTimeline = (variantClass = "") => {
    const classes = ["project-status-timeline"];
    if (variantClass) {
      classes.push(variantClass);
    }

    return (
      <div className={classes.join(" ")}>
        <div className="project-status-timeline__header">
          <div className="project-status-timeline__title">
            <i className="uil uil-pathfinder"></i>
            <span>Project Progress</span>
          </div>
          <span className={`status-badge ${getStatusClass(currentStatusKey)}`}>
            {getStatusLabel(currentStatusKey)}
          </span>
        </div>
        <div className="project-status-timeline__steps">
          <div className="project-status-timeline__line-wrapper">
            <div className="project-status-timeline__line" />
            <div
              className="project-status-timeline__line project-status-timeline__line--progress"
              style={{ transform: `scaleX(${statusProgressRatio})` }}
            />
          </div>
          {statusTimeline.map((step) => (
            <div
              key={step.key}
              className={`project-status-step project-status-step--${step.state}`}
            >
              <div className="project-status-step__icon">
                <i className={`uil ${step.icon}`}></i>
              </div>
              <span className="project-status-step__label">
                <i
                  className={`uil ${
                    step.state === "completed"
                      ? "uil-check-circle"
                      : step.state === "current"
                      ? "uil-history"
                      : "uil-schedule"
                  } project-status-step__indicator`}
                ></i>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const generateAvatar = (name, email) => {
    if (!name)
      return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=default`;
    const seed = email || name;
    return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=${encodeURIComponent(
      seed
    )}`;
  };

  // Smooth closing with CSS animation
  const handleStartClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!editProject) {
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
        `/api/projects/${editProject._id}/comments`,
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
        // Pass the entire updated project back to the parent to update its state
        onSave(data.data.project, { source: "comment" });
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
    const sourceLogs = projectDetails?.logs || editProject?.logs;
    if (!Array.isArray(sourceLogs)) {
      return [];
    }

    return [...sourceLogs].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [projectDetails?.logs, editProject?.logs]);

  if (!isOpen && !closing) return null;

  return (
    <div
      className={`modal ${closing ? "closing" : ""}`}
      style={{ display: "block" }}
    >
      <div
        className={`modal-content project-modal-content ${
          closing ? "closing" : ""
        }`}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {editProject ? "Edit Project" : "Add New Project"}
          </h2>
          <button className="close" onClick={handleStartClose}>
            <i className="uil uil-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <form id="project-form" onSubmit={handleSubmit}>
            <div className="project-form-layout">
              {/* Main Content */}
              <div className="project-main-content">
                {editProject &&
                  renderStatusTimeline("project-status-timeline--desktop")}
                {/* Project Information */}
                <div className="project-section">
                  <h3 className="project-section-title">Project Information</h3>
                  <div className="form-group">
                    <label className="form-label">Project Name *</label>
                    <input
                      type="text"
                      name="projectName"
                      className="form-control"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Brief</label>
                    <ReactQuill
                      theme="snow"
                      value={formData.brief}
                      onChange={handleBriefChange}
                      modules={modules}
                      placeholder="Describe your project requirements..."
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="project-section">
                  <h3 className="project-section-title">Pricing</h3>
                  <div className="form-group">
                    <label className="form-label">Service (optional)</label>
                    <div className="select-wrapper">
                      <select
                        name="serviceId"
                        className="form-control"
                        value={formData.serviceId}
                        onChange={handleInputChange}
                      >
                        <option value="">Select service</option>
                        {services.map((s) => (
                          <option key={String(s._id)} value={String(s._id)}>
                            {s.serviceName}
                          </option>
                        ))}
                      </select>
                      <i
                        className="uil uil-angle-down select-icon"
                        aria-hidden="true"
                      ></i>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price (Rp) *</label>
                      <input
                        type="number"
                        name="price"
                        className="form-control"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        required
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Discount (Rp)</label>
                      <input
                        type="number"
                        name="discount"
                        className="form-control"
                        value={formData.discount}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Price</label>
                      <input
                        type="text"
                        className="form-control readonly"
                        value={formatCurrency(formData.totalPrice)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Deliverables */}
                {editProject && (
                  <div className="project-section">
                    <h3 className="project-section-title">Deliverables</h3>
                    <div className="form-group">
                      <label className="form-label">Deliverables Link</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="url"
                          name="deliverables"
                          className="form-control"
                          value={formData.deliverables}
                          onChange={handleInputChange}
                          placeholder="https://drive.google.com/..."
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() =>
                            window.open(`/result/${editProject._id}`, "_blank")
                          }
                          style={{
                            whiteSpace: "nowrap",
                            padding: "0 16px",
                          }}
                        >
                          <i className="uil uil-external-link-alt"></i>
                          Open Result
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Invoice</label>
                      {hasLinkedInvoice ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: "#e0f2fe",
                              color: "#1e3a8a",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              fontSize: "13px",
                              fontWeight: 500,
                              lineHeight: 1.5,
                              width: "100%",
                            }}
                          >
                            Your invoice has already been generated
                            <strong style={{ marginLeft: "4px" }}>
                              #{invoiceDisplayNumber}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleInvoiceNavigation}
                            style={{
                              whiteSpace: "nowrap",
                              padding: "0 16px",
                            }}
                            disabled={!canNavigateInvoice}
                          >
                            <i className="uil uil-external-link-alt"></i>
                            Open Invoice
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="url"
                            name="invoice"
                            className="form-control"
                            value={formData.invoice}
                            onChange={handleInputChange}
                            placeholder="https://splitbill-alpha.vercel.app/..."
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleInvoiceNavigation}
                            style={{
                              whiteSpace: "nowrap",
                              padding: "0 16px",
                            }}
                            disabled={!canNavigateInvoice}
                          >
                            <i className="uil uil-file-plus"></i>
                            Create Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {editProject && (
                  <div className="project-section">
                    <h3 className="project-section-title">Activity</h3>

                    <div className="project-detail-tabs">
                      <button
                        type="button"
                        className={`project-detail-tab ${
                          activeDetailTab === "comment"
                            ? "project-detail-tab--active"
                            : ""
                        }`}
                        onClick={() => setActiveDetailTab("comment")}
                      >
                        Comments
                      </button>
                      <button
                        type="button"
                        className={`project-detail-tab ${
                          activeDetailTab === "history"
                            ? "project-detail-tab--active"
                            : ""
                        }`}
                        onClick={() => setActiveDetailTab("history")}
                      >
                        History
                      </button>
                    </div>

                    {/* Comment Form */}
                    {activeDetailTab === "comment" ? (
                      <>
                        {" "}
                        <p class="information-text">
                          <i class="uil uil-info-circle"></i> Internal Comment
                          only can be seen by you.
                        </p>
                        <div className="comment-form-wrapper">
                          <div className="comment-input-wrapper">
                            <textarea
                              value={commentContent}
                              onChange={(e) =>
                                setCommentContent(e.target.value)
                              }
                              className="comment-textarea"
                              placeholder="Add a comment or note about this project..."
                              rows="3"
                            />
                            <button
                              type="button"
                              className="comment-send-btn"
                              onClick={handleSubmitComment}
                              disabled={submittingComment}
                            >
                              <i className="uil uil-message"></i>
                            </button>
                          </div>
                        </div>
                        <div className="comments-list">
                          {(() => {
                            const commentSource =
                              projectDetails?.comments || editProject?.comments;
                            if (
                              !Array.isArray(commentSource) ||
                              commentSource.length === 0
                            ) {
                              return (
                                <div className="no-comments">
                                  <i className="uil uil-comment-dots"></i>
                                  <p>
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
                                  className="comment-item"
                                >
                                  <Image
                                    src={generateAvatar(
                                      comment.authorName,
                                      comment.authorEmail
                                    )}
                                    alt={comment.authorName || "Comment author"}
                                    width={32}
                                    height={32}
                                    className="comment-avatar"
                                    unoptimized
                                  />
                                  <div className="comment-content">
                                    <div className="comment-header">
                                      <span className="comment-author">
                                        {comment.authorName}
                                      </span>
                                      <span className="comment-date">
                                        {formatCommentDate(comment.createdAt)}
                                      </span>
                                      <span
                                        className={`comment-badge ${
                                          comment.isClient ? "client" : "team"
                                        }`}
                                      >
                                        {comment.isClient ? "Client" : "Team"}
                                      </span>
                                    </div>
                                    <div className="comment-text">
                                      {comment.content}
                                    </div>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="project-log-container project-log-container--inline">
                        <div className="project-log-list">
                          {sortedLogs.length > 0 ? (
                            sortedLogs.map((log) => {
                              const actorName = log.actorName || "Unknown user";
                              const logKey = log.id || log._id || log.createdAt;

                              return (
                                <div key={logKey} className="project-log-item">
                                  <div className="project-log-header">
                                    <Image
                                      src={generateAvatar(
                                        log.actorName,
                                        log.actorEmail
                                      )}
                                      alt={actorName}
                                      width={32}
                                      height={32}
                                      className="project-log-avatar"
                                      unoptimized
                                    />
                                    <div>
                                      <div className="project-log-title">
                                        {log.message}
                                      </div>
                                      <div className="project-log-meta">
                                        {formatLogTimestamp(log.createdAt)} by{" "}
                                        {actorName}
                                      </div>
                                    </div>
                                  </div>
                                  {log.type === "project_edit" &&
                                    Array.isArray(log.details) &&
                                    log.details.length > 0 && (
                                      <ul className="project-log-details">
                                        {log.details.map((detail, index) => (
                                          <li
                                            key={`${logKey}-${
                                              detail.field || index
                                            }`}
                                          >
                                            <span className="project-log-detail-label">
                                              {detail.label}
                                            </span>{" "}
                                            changed to{" "}
                                            <span className="project-log-detail-value">
                                              {formatLogDetailValue(detail)}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="project-log-empty">
                              <i class="uil uil-history"></i>
                              <p>No log history yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="project-sidebar">
                <div className="project-section">
                  <div className="form-group">
                    <label className="form-label">Order Number</label>
                    <input
                      type="text"
                      name="numberOrder"
                      className="form-control readonly"
                      value={formData.numberOrder}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div className="status-select-wrapper select-wrapper">
                      <span
                        className={`status-label ${getStatusClass(
                          formData.status
                        )} status-select-badge`}
                      >
                        {getStatusLabel(formData.status)}
                      </span>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="to do">To Do</option>
                        <option value="in progress">In Progress</option>
                        <option value="waiting for payment">
                          Waiting for Payment
                        </option>
                        <option value="in review">In Review</option>
                        <option value="revision">Revision</option>
                        <option value="done">Done</option>
                      </select>
                      <i
                        className="uil uil-angle-down select-icon"
                        aria-hidden="true"
                      ></i>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Name *</label>
                    <div className="select-wrapper">
                      <select
                        name="clientName"
                        className="form-control"
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
                      </select>
                      <i
                        className="uil uil-angle-down select-icon"
                        aria-hidden="true"
                      ></i>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client Phone</label>
                    <input
                      type="tel"
                      name="clientPhone"
                      className="form-control"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      step="60"
                      className="form-control"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-buttons-sticky">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStartClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <i className="uil uil-save"></i>
                {loading ? "Saving..." : "Save Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
