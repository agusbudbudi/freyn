"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
}

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params?.id;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading invoice...</p>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>{error || "Invoice not found"}</p>
        </Card>
      </div>
    );
  }

  return (
    <InvoiceForm mode="edit" initialInvoice={invoice} invoiceId={invoice.id} />
  );
}
