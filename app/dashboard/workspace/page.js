"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";

const DEFAULT_WORKSPACE = {
  name: "",
  slug: "",
  plan: "",
  status: "",
  ownerName: "",
};

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const hasChanges = useMemo(() => {
    if (!workspace || !workspace.name) {
      return Boolean(formData.name.trim());
    }
    return formData.name.trim() !== (workspace.name || "");
  }, [formData.name, workspace]);

  const getAuthToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        setError("Authentication required");
        setWorkspace(DEFAULT_WORKSPACE);
        setFormData({ name: "" });
        return;
      }

      const res = await fetch("/api/workspace", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success && data.data?.workspace) {
        const ws = {
          ...DEFAULT_WORKSPACE,
          ...data.data.workspace,
        };
        setWorkspace(ws);
        setFormData({ name: ws.name || "" });
      } else {
        const message = data.message || "Failed to load workspace";
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load workspace");
      toast.error("Failed to load workspace");
      setWorkspace(DEFAULT_WORKSPACE);
      setFormData({ name: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({ name: workspace.name || "" });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      const message = "Workspace name is required";
      setError(message);
      toast.error(message);
      return;
    }

    if (trimmedName.length > 120) {
      const message = "Workspace name must be 120 characters or less";
      setError(message);
      toast.error(message);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const message = "Authentication required";
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await res.json();

      if (data.success && data.data?.workspace) {
        const updatedWorkspace = {
          ...DEFAULT_WORKSPACE,
          ...data.data.workspace,
        };
        setWorkspace(updatedWorkspace);
        setFormData({ name: updatedWorkspace.name || "" });
        toast.success("Workspace updated successfully");

        try {
          const prev = JSON.parse(localStorage.getItem("workspace") || "{}");
          localStorage.setItem(
            "workspace",
            JSON.stringify({ ...prev, ...updatedWorkspace })
          );
        } catch (storageError) {
          console.error("Failed to update workspace cache", storageError);
        }
      } else {
        const message = data.message || "Failed to update workspace";
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update workspace");
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const displayPlan = workspace.plan
    ? workspace.plan === "free"
      ? "Free"
      : "Subscribed"
    : "";
  const displayStatus = workspace.status
    ? workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)
    : "";

  if (loading) {
    return (
      <div className="content-body">
        <LoadingState message="Loading workspace..." />
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
          <div>
            <h2 className="card-title">Workspace Details</h2>
            <p className="card-subtitle">
              Update your workspace name and review subscription information.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="workspace-name">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  name="name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter workspace name"
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workspace-plan">
                  Workspace Plan
                </label>
                <input
                  id="workspace-plan"
                  type="text"
                  className="form-control"
                  value={displayPlan}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workspace-slug">
                  Slug
                </label>
                <input
                  id="workspace-slug"
                  type="text"
                  className="form-control"
                  value={workspace.slug || ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workspace-owner">
                  Owner
                </label>
                <input
                  id="workspace-owner"
                  type="text"
                  className="form-control"
                  value={workspace.ownerName || ""}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workspace-status">
                  Status
                </label>
                <input
                  id="workspace-status"
                  type="text"
                  className="form-control"
                  value={displayStatus}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="card-footer">
            <div className="button-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={saving || !hasChanges}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !hasChanges}
              >
                <i className="uil uil-save"></i>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .card-body {
          padding: 24px;
        }
        .card-footer {
          padding: 16px;
          border-top: 1px solid var(--border-secondary);
          background: var(--bg-secondary);
        }
        .button-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .card-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
