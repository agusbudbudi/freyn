"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import ActionButton from "@/components/ui/ActionButton";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {};
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setClients(data.data.clients);
      } else {
        setError(data.message || "Failed to fetch clients");
      }
    } catch (err) {
      setError("Failed to fetch clients");
      toast.error("Failed to fetch clients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useWorkspaceSwitchListener(fetchClients);

  const handleAddClient = () => {
    router.push("/dashboard/clients/add");
  };

  const handleEditClient = (client) => {
    router.push(`/dashboard/clients/${client.clientId}/edit`);
  };

  const handleDeleteClient = async (client) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.clientId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchClients();
        toast.success("Client deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete client");
      }
    } catch (err) {
      toast.error("Failed to delete client");
      console.error(err);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading clients..." />
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
            placeholder="Search clients by name, company, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
          <Button onClick={handleAddClient}>
            <i className="uil uil-plus"></i>
            Add Client
          </Button>
        </CardHeader>

        <CardBody>
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Client ID", "Client Name", "Company Name", "Contact", "Address", "Actions"].map((h) => (
                      <th key={h} className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 [&:last-child_td]:border-b-0">
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <a
                          href="#"
                          className="text-blue-500 no-underline cursor-pointer whitespace-nowrap hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditClient(client);
                          }}
                        >
                          <strong>{client.clientId}</strong>
                        </a>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{client.clientName}</td>

                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{client.companyName || "-"}</td>

                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <div>
                          {client.phoneNumber && (
                            <span>
                              <i className="uil uil-phone"></i>{" "}
                              {client.phoneNumber}
                            </span>
                          )}
                          {!client.phoneNumber && "-"}
                          {client.email && (
                            <>
                              <br />
                              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                <i className="uil uil-envelope"></i>{" "}
                                {client.email}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs max-w-[240px]">
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap"
                          title={client.address || "-"}
                        >
                          {client.address || "-"}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <div className="flex gap-2">
                          <ActionButton
                            variant="edit"
                            icon="uil uil-edit"
                            onClick={() => handleEditClient(client)}
                            title="Edit Client"
                          />
                          <ActionButton
                            variant="delete"
                            icon="uil uil-trash-alt"
                            onClick={() => handleDeleteClient(client)}
                            title="Delete Client"
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
              icon="uil uil-users-alt"
              title={searchTerm ? "No clients found" : "No clients yet"}
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first client"
              }
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
