"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ServiceForm from "@/components/services/ServiceForm";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EditServicePage() {
  const params = useParams();
  const serviceId = params?.id;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${serviceId}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.message || "Failed to load service");
          toast.error(data.message || "Failed to load service");
          return;
        }
        setService(data.data.service);
      } catch (err) {
        console.error(err);
        setError("Failed to load service");
        toast.error("Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading service...</p>
        </Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>{error || "Service not found"}</p>
        </Card>
      </div>
    );
  }

  return <ServiceForm mode="edit" initialService={service} />;
}
