"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input, { Textarea } from "@/components/ui/Input";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ClientForm({ mode = "create", initialClient = null }) {
  const router = useRouter();
  const isEditing = mode === "edit" && Boolean(initialClient);

  const [formData, setFormData] = useState({
    clientName: initialClient?.clientName || "",
    companyName: initialClient?.companyName || "",
    phoneNumber: initialClient?.phoneNumber || "",
    email: initialClient?.email || "",
    address: initialClient?.address || "",
    notes: initialClient?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/clients/${initialClient.clientId}`
        : "/api/clients";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          isEditing ? "Client updated successfully" : "Client created successfully"
        );
        router.push("/dashboard/clients");
      } else {
        setError(data.message || "Failed to save client");
        toast.error(data.message || "Failed to save client");
      }
    } catch (err) {
      setError("Failed to save client. Please try again.");
      toast.error("Failed to save client. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-2">
            <i className="uil uil-exclamation-triangle"></i> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          {/* Main Content */}
          <div className="flex flex-col gap-4 min-w-0">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <BackButton onClick={() => router.push("/dashboard/clients")} />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 m-0">
                    {isEditing ? "Edit Client" : "Add New Client"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 mb-0">
                    Fill out the client details below
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-900 mt-5 pt-4 mb-3 border-0 border-t border-solid border-slate-100">
                Client Information
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                <FormField label="Client Name *">
                  <Input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter client name"
                  />
                </FormField>

                <FormField label="Company Name">
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </FormField>

                <FormField label="Phone Number">
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="6281234567890"
                  />
                </FormField>

                <FormField label="Email">
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="client@example.com"
                  />
                </FormField>

                <FormField label="Address" className="[grid-column:1/-1]">
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Enter client address"
                  />
                </FormField>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <Card className="p-4 lg:sticky lg:top-[78px]">
            <div className="flex flex-col gap-4">
              {isEditing && (
                <FormField label="Client ID">
                  <Input type="text" value={initialClient.clientId} readOnly disabled />
                </FormField>
              )}

              <FormField label="Notes">
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Additional notes about the client"
                />
              </FormField>

              <div className="flex flex-col gap-2 pt-2 border-0 border-t border-solid border-slate-100">
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                  <i className="uil uil-save"></i>
                  {loading ? "Saving..." : "Save Client"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => router.push("/dashboard/clients")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
