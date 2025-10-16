"use client";

import { useSearchParams } from "next/navigation";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function AddInvoicePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || null;

  return <InvoiceForm mode="create" projectId={projectId} />;
}
