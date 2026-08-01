"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EditClientPage() {
  const params = useParams();
  const clientId = params?.clientId;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.message || "Failed to load client");
          toast.error(data.message || "Failed to load client");
          return;
        }
        setClient(data.data.client);
      } catch (err) {
        console.error(err);
        setError("Failed to load client");
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading client...</p>
        </Card>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>{error || "Client not found"}</p>
        </Card>
      </div>
    );
  }

  return <ClientForm mode="edit" initialClient={client} />;
}
