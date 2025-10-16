"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";

export default function PublicInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const previewRef = useRef(null);
  const invoiceId = params?.id;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/public/invoices/${invoiceId}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to load invoice");
          return;
        }

        setInvoice(data.data.invoice);
      } catch (err) {
        console.error(err);
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleDownloadPdf = async () => {
    if (!invoice || !previewRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const previewEl = previewRef.current;
      previewEl.classList.add("invoice-preview--export");

      const canvas = await html2canvas(previewEl, {
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

      previewEl.classList.remove("invoice-preview--export");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <div className="public-invoice__layout">
        <div className="public-invoice__card">
          <div className="public-invoice__card-inner">
            <div
              className="public-invoice__content"
              style={{ alignItems: "center" }}
            >
              <LoadingState
                message="Loading invoice..."
                description="Tunggu sebentar invoice sedang kami persiapkan."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="public-invoice__layout">
        <div className="public-invoice__card">
          <div
            className="public-invoice__card-inner"
            style={{ gap: "16px", textAlign: "center", padding: "32px" }}
          >
            <p>{error || "Invoice not found"}</p>
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-invoice__layout">
      <div className="public-invoice__card">
        <div className="public-invoice__card-inner">
          <div className="public-invoice__content">
            <header className="public-invoice__header">
              <div className="public-invoice__heading">
                <button
                  type="button"
                  className="btn btn-outline public-invoice__back"
                  onClick={() => router.back()}
                >
                  <i className="uil uil-arrow-left"></i> Back
                </button>
                <div className="public-invoice__title">
                  <h1>
                    Invoice <span>#{invoice.invoiceNumber}</span>
                  </h1>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <p className="public-invoice__subtitle">
                  Jika kamu membutuhkan versi PDF, hubungi Freelencers.
                </p>
              </div>

              {/* hide for now need to fixing pdf export for mobile version */}

              {/* <div className="public-invoice__actions">
                <button className="btn btn-primary" onClick={handleDownloadPdf}>
                  <i className="uil uil-import"></i>
                  Download PDF
                </button>
              </div> */}
            </header>

            <InvoicePreview invoice={invoice} ref={previewRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
