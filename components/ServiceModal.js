"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function ServiceModal({
  isOpen,
  onClose,
  onSave,
  editService = null,
}) {
  const [formData, setFormData] = useState({
    serviceName: "",
    servicePrice: 0,
    durationOfWork: 1,
    totalRevision: 0,
    description: "",
    deliverables: "",
  });

  const [isUnlimitedRevision, setIsUnlimitedRevision] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewServiceId, setPreviewServiceId] = useState("");
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

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
    if (editService) {
      const isUnlimited =
        editService.unlimitedRevision ||
        editService.totalRevision === -1 ||
        editService.totalRevision === null;
      setFormData({
        serviceName: editService.serviceName || "",
        servicePrice: editService.servicePrice || 0,
        durationOfWork: editService.durationOfWork || 1,
        totalRevision: isUnlimited ? 0 : editService.totalRevision || 0,
        description: editService.description || "",
        deliverables: editService.deliverables || "",
      });
      setIsUnlimitedRevision(isUnlimited);
      setPreviewServiceId("");
    } else {
      setFormData({
        serviceName: "",
        servicePrice: 0,
        durationOfWork: 1,
        totalRevision: 0,
        description: "",
        deliverables: "",
      });
      setIsUnlimitedRevision(false);
      // Generate preview Service ID for new services (S + 5 random digits)
      const rand = Math.floor(Math.random() * 90000) + 10000;
      setPreviewServiceId(`S${rand}`);
    }
  }, [editService, isOpen]);

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

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleDeliverablesChange = (value) => {
    setFormData((prev) => ({ ...prev, deliverables: value }));
  };

  const handleUnlimitedRevisionChange = (e) => {
    const checked = e.target.checked;
    setIsUnlimitedRevision(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, totalRevision: 0 }));
    }
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
      const url = editService
        ? `/api/services/${editService.id}`
        : "/api/services";
      const method = editService ? "PUT" : "POST";

      // Set totalRevision to null if unlimited, also set unlimitedRevision boolean
      const submitData = {
        ...formData,
        unlimitedRevision: isUnlimitedRevision,
        totalRevision: isUnlimitedRevision
          ? null
          : parseInt(formData.totalRevision) || 0,
        servicePrice: parseFloat(formData.servicePrice) || 0,
        durationOfWork: parseInt(formData.durationOfWork) || 1,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editService
            ? "Service updated successfully"
            : "Service created successfully"
        );
        onSave();
        handleStartClose();
      } else {
        toast.error(data.message || "Failed to save service");
        setError(data.message || "Failed to save service");
      }
    } catch (err) {
      setError("Failed to save service. Please try again.");
      toast.error("Failed to save service. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  if (!isOpen && !closing) return null;

  return (
    <div
      className={`modal ${closing ? "closing" : ""}`}
      style={{ display: "block" }}
    >
      <div
        className={`modal-content ${closing ? "closing" : ""}`}
        style={{ maxWidth: "800px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {editService ? "Edit Service" : "Add New Service"}
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

          <form id="service-form" onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: "20px" }}>
              {editService && (
                <div className="form-group">
                  <label className="form-label">Service ID</label>
                  <input
                    type="text"
                    className="form-control readonly"
                    value={editService.id}
                    readOnly
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  type="text"
                  name="serviceName"
                  className="form-control"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter service name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  placeholder="Describe your service in detail..."
                  style={{ marginBottom: "20px" }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price (Rp) *</label>
                  <input
                    type="number"
                    name="servicePrice"
                    className="form-control"
                    value={formData.servicePrice}
                    onChange={handleInputChange}
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Duration of Work (days) *
                  </label>
                  <input
                    type="number"
                    name="durationOfWork"
                    className="form-control"
                    value={formData.durationOfWork}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder="Enter duration in days"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Revision</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <input
                    type="number"
                    name="totalRevision"
                    className="form-control"
                    value={formData.totalRevision}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Enter number of revisions"
                    disabled={isUnlimitedRevision}
                    style={{
                      opacity: isUnlimitedRevision ? 0.6 : 1,
                      cursor: isUnlimitedRevision ? "not-allowed" : "text",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="unlimitedRevision"
                      checked={isUnlimitedRevision}
                      onChange={handleUnlimitedRevisionChange}
                      className="checkbox-modern"
                    />
                    <label
                      htmlFor="unlimitedRevision"
                      style={{
                        fontSize: "14px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      Unlimited Revision
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deliverables</label>
                <ReactQuill
                  theme="snow"
                  value={formData.deliverables}
                  onChange={handleDeliverablesChange}
                  modules={modules}
                  placeholder="e.g., source files, revisions, etc."
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
                {loading ? "Saving..." : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
