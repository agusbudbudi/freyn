"use client";

import { useState, useEffect } from "react";
import ServiceModal from "@/components/ServiceModal";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setServices(data.data.services);
      } else {
        setError(data.message || "Failed to fetch services");
      }
    } catch (err) {
      setError("Failed to fetch services");
      toast.error("Failed to fetch services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = async (service) => {
    if (!confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchServices();
        toast.success("Service deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete service");
      }
    } catch (err) {
      toast.error("Failed to delete service");
      console.error(err);
    }
  };

  const handleSaveService = () => {
    fetchServices();
    setIsModalOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredServices = services.filter(
    (service) =>
      service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="content-body">
        <LoadingState message="Loading services..." />
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
          <h2 className="card-title">All Services</h2>
          <button className="btn btn-primary" onClick={handleAddService}>
            <i className="uil uil-plus"></i>
            Add Service
          </button>
        </div>

        <div className="card-header-search">
          <div className="search-input-container">
            <i className="uil uil-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search services by name or category..."
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
          {filteredServices.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Price</th>
                    <th>Duration of Work</th>
                    <th>Total Revision</th>
                    <th>Deliverables</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service._id}>
                      <td>
                        <a
                          href="#"
                          className="link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditService(service);
                          }}
                        >
                          <strong>{service.id}</strong>
                        </a>
                      </td>
                      <td>{service.serviceName}</td>
                      <td className="currency">
                        {formatCurrency(service.servicePrice || 0)}
                      </td>
                      <td>
                        {service.durationOfWork
                          ? `${service.durationOfWork} days`
                          : "-"}
                      </td>
                      <td>
                        {service.unlimitedRevision ||
                        service.totalRevision === -1 ||
                        service.totalRevision === null
                          ? "Unlimited"
                          : service.totalRevision || "0"}
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {service.deliverables
                            ? stripHtml(service.deliverables).substring(0, 50)
                            : "-"}
                          {service.deliverables &&
                            stripHtml(service.deliverables).length > 50 &&
                            "..."}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditService(service)}
                            title="Edit Service"
                          >
                            <i className="uil uil-edit"></i>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteService(service)}
                            title="Delete Service"
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
              <i className="uil uil-package"></i>
              <h3>{searchTerm ? "No services found" : "No services yet"}</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first service"}
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ServiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveService}
          editService={editingService}
        />
      )}
    </div>
  );
}
