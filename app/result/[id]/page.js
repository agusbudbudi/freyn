"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";

export default function ResultPage() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchProjectData();
    }
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const projectData = data.data.project;
        setProject(projectData);
        if (projectData?.linkedInvoiceId) {
          fetchInvoiceData(projectData.linkedInvoiceId);
        } else {
          setInvoice(null);
          setInvoiceError(null);
        }
      } else {
        setError(data.message || "Failed to load project");
      }
    } catch (err) {
      setError("Failed to load project data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceData = async (invoiceId) => {
    if (!invoiceId) {
      setInvoice(null);
      setInvoiceError(null);
      return;
    }

    try {
      setInvoiceLoading(true);
      setInvoiceError(null);
      const response = await fetch(`/api/public/invoices/${invoiceId}`);
      const data = await response.json();

      if (data.success) {
        setInvoice(data.data.invoice);
      } else {
        setInvoice(null);
        setInvoiceError(data.message || "Failed to load invoice");
      }
    } catch (err) {
      console.error(err);
      setInvoice(null);
      setInvoiceError("Failed to load invoice data");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      "to do": { icon: "uil-clock", text: "To Do", class: "status-todo" },
      "in progress": {
        icon: "uil-play",
        text: "In Progress",
        class: "status-progress",
      },
      "waiting for payment": {
        icon: "uil-money-bill",
        text: "Waiting for Payment",
        class: "status-payment",
      },
      "in review": {
        icon: "uil-eye",
        text: "In Review",
        class: "status-review",
      },
      revision: {
        icon: "uil-edit",
        text: "Revision",
        class: "status-revision",
      },
      done: {
        icon: "uil-check-circle",
        text: "Done",
        class: "status-done",
      },
    };
    return statusMap[status] || statusMap["to do"];
  };

  const getMainTitle = (status) => {
    const titles = {
      "to do": "✨ Project kamu lagi dipersiapkan, stay tuned!",
      "in progress": "🚀 Project kamu lagi dikerjakan, progress on the way!",
      "waiting for payment":
        "💳 Yuk selesaikan pembayaran biar project bisa lanjut!",
      "in review": "🔍 Project kamu lagi direview, hampir selesai nih!",
      revision: "✏️ Project kamu lagi direvisi biar makin sempurna!",
      done: "🎉 Yeay! Project kamu sudah selesai dengan sukses!",
    };
    return titles[status] || "Status project";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(value || 0);
    } catch {
      return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
    }
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

  const getInvoiceStatusInfo = (status) => {
    const normalized = (status || "draft").toLowerCase();
    const statusMap = {
      draft: {
        text: "Draft",
        className: "status-label status-pending",
        icon: "uil-file",
      },
      sent: {
        text: "Waiting Payment",
        className: "status-label status-review",
        icon: "uil uil-clock",
      },
      paid: {
        text: "Paid",
        className: "status-label status-success",
        icon: "uil-check-circle",
      },
    };

    return statusMap[normalized] || statusMap.draft;
  };

  const generateAvatar = (name, email) => {
    if (!name)
      return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=default`;
    const seed = email || name;
    return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=${encodeURIComponent(
      seed
    )}`;
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      toast.error("Please enter your comment");
      return;
    }

    setSubmittingComment(true);

    try {
      const commentData = {
        content: commentContent,
        authorName: project.clientName,
        authorEmail:
          project.clientEmail ||
          `${project.clientName.toLowerCase().replace(/\s+/g, "")}@client.com`,
        isClient: true,
      };

      const response = await fetch(`/api/projects/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent("");
        fetchProjectData(); // Refresh to get new comments
        toast.success(
          "Feedback berhasil dikirim! Terima kasih atas masukan Anda."
        );
      } else {
        toast.error("Failed to submit comment: " + data.message);
      }
    } catch (err) {
      toast.error("Failed to submit comment. Please try again.");
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const openDeliverables = (url) => {
    if (!url) {
      toast.error("Deliverables link not available for this project");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleInvoiceNavigation = () => {
    if (project?.invoice) {
      window.open(project.invoice, "_blank", "noopener,noreferrer");
      return;
    }

    if (project?.linkedInvoiceId) {
      window.location.href = `/invoices/${project.linkedInvoiceId}`;
      return;
    }

    toast.error("Invoice not available for this project");
  };

  const canViewInvoice = useMemo(() => {
    return Boolean(project?.invoice || project?.linkedInvoiceId);
  }, [project]);

  const invoiceDisplayNumber = useMemo(() => {
    if (invoice?.invoiceNumber) return invoice.invoiceNumber;
    if (project?.linkedInvoiceNumber) return project.linkedInvoiceNumber;
    if (project?.linkedInvoiceId) return project.linkedInvoiceId;
    return "-";
  }, [invoice, project]);

  if (loading) {
    return (
      <div className="container">
        <div className="result-loading">
          <LoadingState
            message="Loading project data..."
            description="Please wait while we prepare the project details."
          />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <i
            className="uil uil-exclamation-triangle"
            style={{ fontSize: "48px", color: "#ef4444", marginBottom: "20px" }}
          ></i>
          <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>Error</h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            {error || "Project not found"}
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(project.status);
  const invoiceStatusInfo = invoice
    ? getInvoiceStatusInfo(invoice.status)
    : null;
  const clientComments = (project.comments || [])
    .filter((comment) => comment.isClient)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="main-illustration">
          <Image
            src="/images/success-image.png"
            alt="Hero Illustration"
            width={500}
            height={500}
            className="hero-illustration-img"
            priority
          />
        </div>

        <div className="status-text">Progress Report</div>
        <div className="main-title">{getMainTitle(project.status)}</div>
      </div>

      {/* Project Details */}
      <div className="projects-section">
        <div className="details-section">
          <div className="detail-row">
            <span className="detail-label">Order No</span>
            <span className="detail-value">{project.numberOrder}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Project Name</span>
            <span className="detail-value">{project.projectName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Client</span>
            <span className="detail-value">{project.clientName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Due Date</span>
            <span className="detail-value">{formatDate(project.deadline)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span className="status-badge-container">
                <span className={`status-label ${statusInfo.class}`}>
                  <i className={`uil ${statusInfo.icon}`}></i> {statusInfo.text}
                </span>
              </span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="buttons-section" style={{ marginTop: "16px" }}>
          <button
            onClick={() => openDeliverables(project.deliverables)}
            className="btn btn-primary"
            style={{
              opacity: project.deliverables ? "1" : "0.6",
            }}
          >
            <i className="uil uil-external-link-alt"></i> Lihat Hasil Desain
          </button>
        </div>
      </div>

      {/* Payment Section */}
      <div className="payment-section">
        <div className="details-section">
          <h4 className="section-title">Payment Information</h4>
          <div className="detail-row">
            <span className="detail-label">Payment Status</span>
            <span className="detail-value">
              {invoiceLoading ? (
                "Loading..."
              ) : invoice ? (
                <span className={invoiceStatusInfo.className}>
                  <i className={`uil ${invoiceStatusInfo.icon}`}></i>{" "}
                  {invoiceStatusInfo.text}
                </span>
              ) : invoiceError ? (
                <span style={{ color: "#ef4444" }}>{invoiceError}</span>
              ) : (
                "Invoice not available"
              )}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Total Amount</span>
            <span className="detail-value">
              {invoice
                ? formatCurrency(invoice.total)
                : formatCurrency(project.totalPrice)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Invoice ID</span>
            <span className="detail-value">{invoiceDisplayNumber}</span>
          </div>
        </div>

        <div className="buttons-section" style={{ marginTop: "16px" }}>
          <button
            onClick={handleInvoiceNavigation}
            className="btn btn-secondary"
            disabled={!canViewInvoice}
            style={{
              opacity: canViewInvoice ? "1" : "0.6",
              cursor: canViewInvoice ? "pointer" : "not-allowed",
            }}
          >
            Lihat Invoice
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h4 className="section-title">Feedback & Comments</h4>
        <p className="section-subtitle">
          Share your thoughts about this project
        </p>

        {/* Comment Form */}
        <div className="client-comment-form">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="comment-input"
            rows="4"
            placeholder="Write your feedback or questions here..."
          />
          <button
            type="button"
            className="btn btn-primary comment-submit-btn"
            onClick={handleSubmitComment}
            disabled={submittingComment}
          >
            <i className="uil uil-comment-plus"></i>
            {submittingComment ? "Sending..." : "Send Feedback"}
          </button>
        </div>

        {/* Comments List */}
        <div className="client-comments-container">
          {clientComments.length > 0 ? (
            <div className="client-comments-list">
              {clientComments.map((comment, index) => (
                <div
                  key={comment.id || comment.createdAt || index}
                  className="client-comment-item"
                >
                  <img
                    src={generateAvatar(
                      comment.authorName,
                      comment.authorEmail
                    )}
                    alt={comment.authorName}
                    className="client-comment-avatar"
                  />
                  <div className="client-comment-content">
                    <div className="client-comment-header">
                      <span className="client-comment-author">
                        {comment.authorName}
                      </span>
                      <span className="client-comment-date">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                      <span
                        className="client-comment-badge"
                        style={{
                          background: comment.isClient ? "#d1fae5" : "#e0e7ff",
                        }}
                      >
                        {comment.isClient ? "Client" : "Admin"}
                      </span>
                    </div>
                    <div className="client-comment-text">{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-comments-state">
              <i className="uil uil-comment-dots"></i>
              <p>No feedback yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <div className="security-icon">
          <Image
            src="/images/security-icon.png"
            alt="Security Icon"
            width={100}
            height={100}
            className="security-img"
          />
        </div>
        <div className="security-text">
          Semua informasi proyek dipastikan tersimpan dengan aman dan
          terlindungi.
        </div>
      </div>

      {/* Social Media Section */}
      <div className="social-section">
        <div
          className="logo sidebar-logo"
          style={{
            marginBottom: "1rem",
            justifyContent: "center",
            color: "white",
          }}
        >
          <div className="logo-icon">
            {/* <i className="fas fa-palette"></i> */}
            <img src="/images/logo-freyn.png" alt="Logo" className="logo-img" />
          </div>
          <h3 className="social-title">Freyn</h3>
        </div>

        <div className="footer">Follow Us on Social Media</div>
        <div className="social-grid">
          <a href="mailto:agdesign.official@gmail.com" className="social-link">
            <i className="uil uil-envelope"></i>
          </a>
          <a
            href="https://instagram.com/gousstudio"
            className="social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="uil uil-instagram"></i>
          </a>
          <a
            href="https://wa.me/6285559496968"
            className="social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="uil uil-whatsapp"></i>
          </a>
          <a
            href="https://gousstudio.com"
            className="social-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="uil uil-globe"></i>
          </a>
        </div>
        <div className="footer">
          <p>
            Powered by <strong>Freyn</strong> Your All-in-One Freelance
            Management System
          </p>
        </div>
      </div>
    </div>
  );
}
