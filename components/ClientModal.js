"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  editClient = null,
}) {
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    address: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewClientId, setPreviewClientId] = useState("");
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (editClient) {
      setFormData({
        clientName: editClient.clientName || "",
        companyName: editClient.companyName || "",
        phoneNumber: editClient.phoneNumber || "",
        email: editClient.email || "",
        address: editClient.address || "",
        notes: editClient.notes || "",
      });
      setPreviewClientId("");
    } else {
      setFormData({
        clientName: "",
        companyName: "",
        phoneNumber: "",
        email: "",
        address: "",
        notes: "",
      });
      // Generate preview Client ID for new clients
      setPreviewClientId(`C${Date.now()}`);
    }
  }, [editClient, isOpen]);

  useEffect(() => {
    if (isOpen) setClosing(false);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editClient
        ? `/api/clients/${editClient.clientId}`
        : "/api/clients";
      const method = editClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editClient
            ? "Client updated successfully"
            : "Client created successfully"
        );
        onSave();
        handleStartClose();
      } else {
        toast.error(data.message || "Failed to save client");
        setError(data.message || "Failed to save client");
      }
    } catch (err) {
      setError("Failed to save client. Please try again.");
      toast.error("Failed to save client. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !closing) return null;

  return (
    <div
      className={`modal ${closing ? "closing" : ""}`}
      style={{ display: "block" }}
    >
      <div
        className={`modal-content ${closing ? "closing" : ""}`}
        style={{ maxWidth: "600px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {editClient ? "Edit Client" : "Add New Client"}
          </h2>
          <button className="close" onClick={handleStartClose}>
            <i className="uil uil-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <form id="client-form" onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: "20px" }}>
              {editClient && (
                <div className="form-group">
                  <label className="form-label">Client ID</label>
                  <input
                    type="text"
                    className="form-control readonly"
                    value={editClient.clientId}
                    readOnly
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  className="form-control"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter client name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-control"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="form-control"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="6281234567890"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Enter client address"
                  style={{
                    resize: "vertical",
                    fontFamily: "Poppins, sans-serif",
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Additional notes about the client"
                  style={{
                    resize: "vertical",
                    fontFamily: "Poppins, sans-serif",
                  }}
                />
              </div>
            </div>

            <div className="modal-buttons-sticky">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStartClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <i className="uil uil-save"></i>
                {loading ? "Saving..." : "Save Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
