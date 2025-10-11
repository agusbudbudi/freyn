"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { toast } from "@/components/ui/toast";
import {
  formatCurrency,
  formatDateHuman,
} from "@/components/invoices/utils";

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

  useEffect(() => {
    const fetchInvoices = async () => {
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
    };

    fetchInvoices();
  }, []);

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
      <div className="content-body">
        <LoadingState message="Loading invoices..." />
      </div>
    );
  }

  return (
    <div className="content-body">
      {error && (
        <div className="alert alert-error">
          <i className="uil uil-exclamation-triangle"></i> {error}
        </div>
      )}

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Invoices</h2>
          <Link href="/dashboard/invoices/add" className="btn btn-primary">
            <i className="uil uil-plus"></i>
            Create Invoice
          </Link>
        </div>

        <div className="card-header-search">
          <div className="search-input-container">
            <i className="uil uil-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search by invoice number, client name, or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                style={{ display: "flex" }}
              >
                <i className="uil uil-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {filteredInvoices.length ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Client</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <a
                          href="#"
                          className="link"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/dashboard/invoices/${invoice.id}`);
                          }}
                        >
                          <strong>{invoice.invoiceNumber}</strong>
                        </a>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>{invoice.billedTo?.name || invoice.billedTo?.company || "-"}</strong>
                          {invoice.billedTo?.company && (
                            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                              {invoice.billedTo.company}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatDateHuman(invoice.invoiceDate)}</td>
                      <td>{formatDateHuman(invoice.dueDate)}</td>
                      <td>
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="currency">
                        {formatCurrency(invoice.total ?? invoice.subtotal)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            title="View"
                            onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                          >
                            <i className="uil uil-eye"></i>
                          </button>
                          <button
                            className="action-btn edit"
                            title="Edit"
                            onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                          >
                            <i className="uil uil-edit"></i>
                          </button>
                          <button
                            className="action-btn delete"
                            title="Delete"
                            onClick={() => handleDeleteInvoice(invoice)}
                            disabled={deletingId === invoice.id}
                          >
                            <i className="uil uil-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <i className="uil uil-receipt"></i>
              <h3>{searchTerm ? "No invoices found" : "No invoices yet"}</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search query"
                  : "Create your first invoice to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
