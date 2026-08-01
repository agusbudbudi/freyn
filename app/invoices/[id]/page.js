"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";

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
      <>
        <SiteHeader />
        <div className="min-h-screen bg-slate-50 flex justify-center items-start p-0 sm:p-4 pt-16 sm:pt-24">
          <div className="w-full max-w-[960px] flex flex-col items-center justify-center gap-5 px-4 py-6 sm:p-6">
            <LoadingState
              message="Loading invoice..."
              description="Tunggu sebentar invoice sedang kami persiapkan."
            />
          </div>
        </div>
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <SiteHeader />
        <div className="min-h-screen bg-slate-50 flex justify-center items-start p-0 sm:p-4 pt-16 sm:pt-24">
          <div className="w-full max-w-[960px] flex flex-col items-center gap-4 px-4 py-6 sm:p-8 text-center">
            <p>{error || "Invoice not found"}</p>
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-slate-50 flex justify-center items-start p-0 sm:p-4 pt-16 sm:pt-24">
        <div className="w-full max-w-[960px] flex flex-col gap-5 px-4 py-6 sm:p-6">
        <header className="flex flex-col items-stretch gap-4">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <BackButton onClick={() => router.back()} />
              <h1 className="m-0 text-base flex items-center gap-2.5 text-slate-900">
                <span className="font-semibold">#{invoice.invoiceNumber}</span>
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="m-0 text-xs text-slate-500">
              Jika kamu membutuhkan versi PDF, hubungi Freelencers.
            </p>
          </div>

          {/* hide for now need to fixing pdf export for mobile version */}

          {/* <div className="flex gap-3 items-center">
            <Button onClick={handleDownloadPdf}>
              <i className="uil uil-import"></i>
              Download PDF
            </Button>
          </div> */}
        </header>

        <InvoicePreview invoice={invoice} ref={previewRef} constrained={false} />
        </div>
      </div>
    </>
  );
}
