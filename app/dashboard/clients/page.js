"use client";

import { useState, useEffect } from "react";
import ClientModal from "@/components/ClientModal";
import { toast } from "@/components/ui/toast";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
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
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (client) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.clientId}`, {
        method: "DELETE",
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

  const handleSaveClient = () => {
    fetchClients();
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="content-body">
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <i
            className="uil uil-spinner-alt"
            style={{
              fontSize: "3rem",
              color: "#4f46e5",
              animation: "spin 1s linear infinite",
            }}
          ></i>
          <p style={{ marginTop: "1rem", color: "#6b7280" }}>
            Loading clients...
          </p>
        </div>
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
          <h2 className="card-title">All Clients</h2>
          <button className="btn btn-primary" onClick={handleAddClient}>
            <i className="uil uil-plus"></i>
            Add Client
          </button>
        </div>

        <div className="card-header-search">
          <div className="search-input-container">
            <i className="uil uil-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search clients by name, company, or phone..."
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
          {filteredClients.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Client Name</th>
                    <th>Company Name</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td>
                        <a
                          href="#"
                          className="link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditClient(client);
                          }}
                        >
                          <strong>{client.clientId}</strong>
                        </a>
                      </td>
                      <td>{client.clientName}</td>

                      <td>{client.companyName || "-"}</td>

                      <td>
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
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <i className="uil uil-envelope"></i>{" "}
                                {client.email}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ maxWidth: "240px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={client.address || "-"}
                        >
                          {client.address || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClient(client)}
                            title="Edit Client"
                          >
                            <i className="uil uil-edit"></i>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteClient(client)}
                            title="Delete Client"
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
              <i className="uil uil-users-alt"></i>
              <h3>{searchTerm ? "No clients found" : "No clients yet"}</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first client"}
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveClient}
          editClient={editingClient}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
