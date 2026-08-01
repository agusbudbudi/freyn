"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectForm from "@/components/projects/ProjectForm";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params?.projectId;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.message || "Failed to load project");
          toast.error(data.message || "Failed to load project");
          return;
        }
        setProject(data.data.project);
      } catch (err) {
        console.error(err);
        setError("Failed to load project");
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading project...</p>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>{error || "Project not found"}</p>
        </Card>
      </div>
    );
  }

  return <ProjectForm mode="edit" initialProject={project} />;
}
