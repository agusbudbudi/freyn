"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { toast } from "@/components/ui/toast";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);
  const invoiceId = params?.id;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.message || "Failed to load invoice");
          toast.error(data.message || "Failed to load invoice");
          return;
        }
        setInvoice(data.data.invoice);
      } catch (err) {
        console.error(err);
        setError("Failed to load invoice");
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleStatusChange = async (newStatus) => {
    if (!invoiceId || !newStatus || newStatus === invoice.status) return;
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Failed to update status");
        return;
      }
      setInvoice(data.data.invoice);
      toast.success("Invoice status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !previewRef.current) return;
    setDownloading(true);
    const previewEl = previewRef.current;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      previewEl.classList.add("invoice-preview--export");

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        ignoreElements: (element) =>
          element.classList?.contains("invoice-preview__actions"),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber || "invoice"}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    } finally {
      previewEl.classList.remove("invoice-preview--export");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <div className="content-card" style={{ padding: "32px" }}>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="content-body">
        <div className="content-card" style={{ padding: "32px" }}>
          <p>{error || "Invoice not found"}</p>
          <button
            className="btn btn-secondary"
            onClick={() => router.push("/dashboard/invoices")}
          >
            Back to invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="content-card" style={{ padding: "16px" }}>
        <div className="invoice-detail-header">
          <div className="invoice-detail-heading">
            <button
              className="btn btn-back"
              onClick={() => router.push("/dashboard/invoices")}
            >
              <i className="uil uil-arrow-left"></i>
            </button>
            <div className="invoice-detail-title">
              <h2 className="card-title">
                <span>Invoice</span>
                <span className="invoice-detail-number">
                  {invoice.invoiceNumber}
                </span>
              </h2>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="invoice-detail-actions">
            <div className="invoice-detail-status">
              <label>Status</label>
              <div className="select-wrapper">
                <select
                  className="form-control"
                  value={invoice.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
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
            <div className="invoice-detail-buttons">
              <button
                className="btn btn-secondary"
                onClick={() =>
                  router.push(`/dashboard/invoices/${invoice.id}/edit`)
                }
              >
                <i className="uil uil-edit"></i>
                Edit
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <i className="uil uil-import"></i>
                {downloading ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>

        <InvoicePreview invoice={invoice} ref={previewRef} showStatus />
      </div>
    </div>
  );
}
