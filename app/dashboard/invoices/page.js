"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { toast } from "@/components/ui/toast";
import {
  formatCurrency,
  formatDateHuman,
} from "@/components/invoices/utils";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import ActionButton from "@/components/ui/ActionButton";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to load invoices");
        toast.error(data.message || "Failed to load invoices");
        return;
      }
      setInvoices(data.data.invoices || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoices");
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useWorkspaceSwitchListener(fetchInvoices);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter((invoice) => {
      const term = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.billedTo?.name?.toLowerCase().includes(term) ||
        invoice.billedTo?.company?.toLowerCase().includes(term)
      );
    });
  }, [invoices, searchTerm]);

  const handleDeleteInvoice = async (invoice) => {
    if (!invoice?.id) return;

    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(invoice.id);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Failed to delete invoice");
        return;
      }

      setInvoices((prev) => prev.filter((item) => item.id !== invoice.id));
      toast.success("Invoice deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading invoices..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      {error && (
        <Alert type="error">
          <i className="uil uil-exclamation-triangle"></i> {error}
        </Alert>
      )}

      <Card>
        <CardHeader className="flex-wrap">
          <SearchInput
            placeholder="Search by invoice number, client name, or company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
          <Link href="/dashboard/invoices/add" className={buttonClasses()}>
            <i className="uil uil-plus"></i>
            Create Invoice
          </Link>
        </CardHeader>

        <CardBody>
          {filteredInvoices.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Invoice Number", "Client", "Invoice Date", "Due Date", "Status", "Total", "Public Page", "Actions"].map((h) => (
                      <th key={h} className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 [&:last-child_td]:border-b-0">
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <a
                          href="#"
                          className="text-blue-500 no-underline cursor-pointer whitespace-nowrap hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/dashboard/invoices/${invoice.id}`);
                          }}
                        >
                          <strong>{invoice.invoiceNumber}</strong>
                        </a>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <div className="flex flex-col">
                          <strong>{invoice.billedTo?.name || invoice.billedTo?.company || "-"}</strong>
                          {invoice.billedTo?.company && (
                            <span className="text-slate-500 text-[11px]">
                              {invoice.billedTo.company}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{formatDateHuman(invoice.invoiceDate)}</td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{formatDateHuman(invoice.dueDate)}</td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs font-bold text-emerald-600">
                        {formatCurrency(invoice.total ?? invoice.subtotal)}
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <a
                          href={`/invoices/${invoice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-500 no-underline hover:underline"
                        >
                          <i className="uil uil-external-link-alt"></i>
                          View Public Page
                        </a>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <div className="flex gap-2">
                          <ActionButton
                            variant="view"
                            icon="uil uil-eye"
                            title="View"
                            onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                          />
                          <ActionButton
                            variant="edit"
                            icon="uil uil-edit"
                            title="Edit"
                            onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                          />
                          <ActionButton
                            variant="delete"
                            icon="uil uil-trash-alt"
                            title="Delete"
                            onClick={() => handleDeleteInvoice(invoice)}
                            disabled={deletingId === invoice.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="uil uil-receipt"
              title={searchTerm ? "No invoices found" : "No invoices yet"}
              description={
                searchTerm
                  ? "Try adjusting your search query"
                  : "Create your first invoice to get started"
              }
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
