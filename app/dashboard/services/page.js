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

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
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

  const fetchServices = useCallback(async () => {
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
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useWorkspaceSwitchListener(fetchServices);

  const handleAddService = () => {
    router.push("/dashboard/services/add");
  };

  const handleEditService = (service) => {
    router.push(`/dashboard/services/${service.id}/edit`);
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
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading services..." />
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
            placeholder="Search services by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
          <Button onClick={handleAddService}>
            <i className="uil uil-plus"></i>
            Add Service
          </Button>
        </CardHeader>

        <CardBody>
          {filteredServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Service ID", "Service Name", "Price", "Duration of Work", "Total Revision", "Deliverables", "Action"].map((h) => (
                      <th key={h} className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service._id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 [&:last-child_td]:border-b-0">
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <a
                          href="#"
                          className="text-blue-500 no-underline cursor-pointer whitespace-nowrap hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditService(service);
                          }}
                        >
                          <strong>{service.id}</strong>
                        </a>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{service.serviceName}</td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs font-bold text-emerald-600">
                        {formatCurrency(service.servicePrice || 0)}
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        {service.durationOfWork
                          ? `${service.durationOfWork} days`
                          : "-"}
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        {service.unlimitedRevision ||
                          service.totalRevision === -1 ||
                          service.totalRevision === null
                          ? "Unlimited"
                          : service.totalRevision || "0"}
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs max-w-[200px]">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {service.deliverables
                            ? stripHtml(service.deliverables).substring(0, 50)
                            : "-"}
                          {service.deliverables &&
                            stripHtml(service.deliverables).length > 50 &&
                            "..."}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                        <div className="flex gap-2">
                          <ActionButton
                            variant="edit"
                            icon="uil uil-edit"
                            onClick={() => handleEditService(service)}
                            title="Edit Service"
                          />
                          <ActionButton
                            variant="delete"
                            icon="uil uil-trash-alt"
                            onClick={() => handleDeleteService(service)}
                            title="Delete Service"
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
              icon="uil uil-package"
              title={searchTerm ? "No services found" : "No services yet"}
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first service"
              }
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
