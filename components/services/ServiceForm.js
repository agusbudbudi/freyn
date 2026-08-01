"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ServiceForm({ mode = "create", initialService = null }) {
  const router = useRouter();
  const isEditing = mode === "edit" && Boolean(initialService);

  const initialUnlimited = isEditing
    ? Boolean(
      initialService.unlimitedRevision ||
      initialService.totalRevision === -1 ||
      initialService.totalRevision === null
    )
    : false;

  const [formData, setFormData] = useState({
    serviceName: initialService?.serviceName || "",
    servicePrice: initialService?.servicePrice || 0,
    durationOfWork: initialService?.durationOfWork || 1,
    totalRevision: initialUnlimited ? 0 : initialService?.totalRevision || 0,
    description: initialService?.description || "",
    deliverables: initialService?.deliverables || "",
  });
  const [isUnlimitedRevision, setIsUnlimitedRevision] = useState(initialUnlimited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/services/${initialService.id}`
        : "/api/services";
      const method = isEditing ? "PUT" : "POST";

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
          isEditing ? "Service updated successfully" : "Service created successfully"
        );
        router.push("/dashboard/services");
      } else {
        setError(data.message || "Failed to save service");
        toast.error(data.message || "Failed to save service");
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

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <div className="p-6 flex items-center gap-3">
          <BackButton onClick={() => router.push("/dashboard/services")} />
          <div>
            <h2 className="text-base font-semibold text-slate-900 m-0">
              {isEditing ? "Edit Service" : "Add New Service"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              Fill out the service details below
            </p>
          </div>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-2">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            {isEditing && (
              <FormField label="Service ID">
                <Input type="text" value={initialService.id} readOnly disabled />
              </FormField>
            )}

            <FormField label="Service Name *">
              <Input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleInputChange}
                required
                placeholder="Enter service name"
              />
            </FormField>

            <FormField label="Price (Rp) *">
              <Input
                type="number"
                name="servicePrice"
                value={formData.servicePrice}
                onChange={handleInputChange}
                min="0"
                required
                placeholder="0"
              />
            </FormField>

            <FormField label="Duration of Work (days) *">
              <Input
                type="number"
                name="durationOfWork"
                value={formData.durationOfWork}
                onChange={handleInputChange}
                min="1"
                required
                placeholder="Enter duration in days"
              />
            </FormField>

            <FormField label="Total Revision">
              <div className="flex flex-col gap-2.5">
                <Input
                  type="number"
                  name="totalRevision"
                  value={formData.totalRevision}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Enter number of revisions"
                  disabled={isUnlimitedRevision}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUnlimitedRevision}
                    onChange={handleUnlimitedRevisionChange}
                    className="w-4 h-4 accent-signal-blue cursor-pointer"
                  />
                  Unlimited Revision
                </label>
              </div>
            </FormField>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={handleDescriptionChange}
              modules={modules}
              placeholder="Describe your service in detail..."
            />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Deliverables</h3>
            <ReactQuill
              theme="snow"
              value={formData.deliverables}
              onChange={handleDeliverablesChange}
              modules={modules}
              placeholder="e.g., source files, revisions, etc."
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/dashboard/services")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              <i className="uil uil-save"></i>
              {loading ? "Saving..." : "Save Service"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
