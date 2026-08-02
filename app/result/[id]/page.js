"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { inter } from "@/lib/fonts";
import SiteHeader from "@/components/SiteHeader";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import StatusBadge from "@/components/ui/StatusBadge";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";

const primaryBtnClasses =
  "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-buttons font-semibold text-base text-white bg-signal-blue border border-solid border-transparent transition-colors hover:bg-signal-blue/90 disabled:opacity-60 disabled:cursor-not-allowed";
const secondaryBtnClasses =
  "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-buttons font-semibold text-base text-slate-500 bg-white border border-solid border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed";

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
      <>
        <SiteHeader />
        <div className={`${inter.variable} font-inter min-h-screen bg-gradient-to-b from-signal-blue/15 via-white to-slate-50`}>
          <div className="max-w-[480px] mx-auto px-4 pt-20 pb-6 sm:pt-24">
            <div className="flex justify-center py-20 px-4">
              <LoadingState
                message="Loading project data..."
                description="Please wait while we prepare the project details."
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <SiteHeader />
        <div className={`${inter.variable} font-inter min-h-screen bg-gradient-to-b from-signal-blue/15 via-white to-slate-50`}>
          <div className="max-w-[480px] mx-auto px-4 pt-20 pb-6 sm:pt-24">
            <div className="text-center py-24 px-5">
              <i className="uil uil-exclamation-triangle text-5xl text-red-500 mb-5 block"></i>
              <h2 className="text-red-500 mb-2.5 text-xl font-semibold">Error</h2>
              <p className="text-slate-500 mb-5">{error || "Project not found"}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusInfo(project.status);
  const clientComments = (project.comments || [])
    .filter((comment) => comment.isClient)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <>
      <SiteHeader />
      <div className={`${inter.variable} font-inter min-h-screen bg-gradient-to-b from-signal-blue/15 via-white to-slate-50`}>
        <div className="max-w-[480px] mx-auto px-4 pt-20 pb-6 sm:pt-24">
        {/* Hero Section */}
        <div className="text-center p-5 relative">
          <div className="w-[120px] h-[120px] mx-auto rounded-[20px] flex items-center justify-center relative overflow-hidden">
            <Image
              src="/images/success-image.png"
              alt="Hero Illustration"
              width={400}
              height={400}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <div className="text-white text-xs m-4 text-center bg-signal-blue rounded-tags py-[3px] px-3 inline-block">
            Progress Report
          </div>
          <div className="text-xl font-semibold text-signal-blue text-center">
            {getMainTitle(project.status)}
          </div>
        </div>

        {/* Project Details */}
        <div className="my-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-card">
          <div>
            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Order No
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {project.numberOrder}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Project Name
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {project.projectName}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Client
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {project.clientName}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Due Date
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {formatDate(project.deadline)}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Status
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                <StatusBadge status={statusInfo.class}>
                  <i className={`uil ${statusInfo.icon}`}></i> {statusInfo.text}
                </StatusBadge>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4">
            <button
              onClick={() => openDeliverables(project.deliverables)}
              className={primaryBtnClasses}
              style={{ opacity: project.deliverables ? "1" : "0.6" }}
            >
              <i className="uil uil-external-link-alt"></i> Lihat Hasil Desain
            </button>
          </div>
        </div>

        {/* Payment Section */}
        <div className="my-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-card">
          <div>
            <h4 className="text-base text-slate-900 mb-1.5">
              Payment Information
            </h4>
            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Payment Status
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {invoiceLoading ? (
                  "Loading..."
                ) : invoice ? (
                  <InvoiceStatusBadge status={invoice.status} />
                ) : invoiceError ? (
                  <span className="text-red-500">{invoiceError}</span>
                ) : (
                  "Invoice not available"
                )}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-gray-100 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Total Amount
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {invoice
                  ? formatCurrency(invoice.total)
                  : formatCurrency(project.totalPrice)}
              </span>
            </div>

            <div className="flex justify-between items-center py-4 gap-2.5">
              <span className="text-[15px] text-slate-500 font-medium whitespace-nowrap">
                Invoice ID
              </span>
              <span className="text-[15px] text-slate-900 font-semibold text-right">
                {invoiceDisplayNumber}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleInvoiceNavigation}
              className={secondaryBtnClasses}
              disabled={!canViewInvoice}
            >
              Lihat Invoice
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="my-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-card">
          <h4 className="text-base text-slate-900 mb-1.5">
            Feedback & Comments
          </h4>
          <p className="text-slate-500 text-xs mb-5 text-left">
            Share your thoughts about this project
          </p>

          {/* Comment Form */}
          <div className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full min-h-[100px] p-4 border border-slate-200 rounded-xl text-sm resize-y mb-3 bg-white transition-colors placeholder:text-gray-400 focus:outline-none focus:border-signal-blue focus:ring-[3px] focus:ring-sky-wash"
              rows="4"
              placeholder="Write your feedback or questions here..."
            />
            <button
              type="button"
              className={primaryBtnClasses}
              onClick={handleSubmitComment}
              disabled={submittingComment}
            >
              <i className="uil uil-comment-plus"></i>
              {submittingComment ? "Sending..." : "Send Feedback"}
            </button>
          </div>

          {/* Comments List */}
          <div>
            {clientComments.length > 0 ? (
              <div className="flex flex-col gap-2">
                {clientComments.map((comment, index) => (
                  <div
                    key={comment.id || comment.createdAt || index}
                    className="flex gap-3 py-2.5"
                  >
                    <img
                      src={generateAvatar(
                        comment.authorName,
                        comment.authorEmail
                      )}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-100 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900 text-xs max-w-[120px] overflow-hidden whitespace-nowrap text-ellipsis shrink-0">
                          {comment.authorName}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {formatCommentDate(comment.createdAt)}
                        </span>
                        <span
                          className={`inline-flex items-center text-[10px] py-0.5 px-1.5 rounded-[10px] font-medium ${comment.isClient
                            ? "bg-[#dcfce7] text-[#15803d]"
                            : "bg-[#f3e8ff] text-[#6b21a8]"
                            }`}
                        >
                          {comment.isClient ? "Client" : "Admin"}
                        </span>
                      </div>
                      <div className="text-slate-800 text-xs leading-[1.5] whitespace-pre-wrap break-words">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <i className="uil uil-comment-dots text-[32px] mb-1 text-slate-400 block"></i>
                <p className="m-0 text-xs text-slate-400">
                  No feedback yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-signal-blue/10 my-5 p-5 rounded-2xl flex items-center gap-[15px]">
          <div className="w-10 h-10 bg-signal-blue rounded-full flex items-center justify-center text-white text-lg shrink-0">
            <Image
              src="/images/security-icon.png"
              alt="Security Icon"
              width={100}
              height={100}
              className="w-[70%] h-[70%] object-contain"
            />
          </div>
          <div className="text-slate-900 text-xs font-medium leading-[1.4]">
            Semua informasi proyek dipastikan tersimpan dengan aman dan
            terlindungi.
          </div>
        </div>

        {/* Social Media Section */}
        <div className="p-[30px] max-md:p-5">
          <div className="flex items-center gap-[5px] justify-center text-white mb-4">
            <div className="w-8 h-8 flex">
              <img
                src="/images/logo-freyn.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-center text-2xl font-bold text-gray-900 m-0">
              Freyn
            </h3>
          </div>

          <div className="text-center text-xs text-slate-500 mt-[5px]">
            Follow Us on Social Media
          </div>
          <div className="flex justify-center gap-3 my-[30px]">
            <a
              href="mailto:agdesign.official@gmail.com"
              className="flex items-center gap-2.5 py-3 px-4 bg-white rounded-full no-underline text-signal-blue font-medium text-base transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <i className="uil uil-envelope"></i>
            </a>
            <a
              href="https://instagram.com/gousstudio"
              className="flex items-center gap-2.5 py-3 px-4 bg-white rounded-full no-underline text-signal-blue font-medium text-base transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="uil uil-instagram"></i>
            </a>
            <a
              href="https://wa.me/6285559496968"
              className="flex items-center gap-2.5 py-3 px-4 bg-white rounded-full no-underline text-signal-blue font-medium text-base transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="uil uil-whatsapp"></i>
            </a>
            <a
              href="https://gousstudio.com"
              className="flex items-center gap-2.5 py-3 px-4 bg-white rounded-full no-underline text-signal-blue font-medium text-base transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="uil uil-globe"></i>
            </a>
          </div>
          <div className="text-center text-xs text-slate-500 mt-[5px]">
            <p>
              Powered by <strong>Freyn</strong> Your All-in-One Freelance
              Management System
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
