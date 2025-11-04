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

const WORKSPACE_TABS = {
  DETAILS: "details",
  MEMBERS: "members",
};

const WORKSPACE_MEMBER_ROLES = [
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
];

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(WORKSPACE_TABS.DETAILS);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: "", role: "member" });
  const [memberErrors, setMemberErrors] = useState({});
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ role: "member" });
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);

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

  async function fetchMembers(force = false) {
    try {
      if (membersLoading && !force) {
        return;
      }

      setMembersLoading(true);

      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required");
        setMembers([]);
        return;
      }

      const res = await fetch("/api/workspace/members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMembers(data.data?.members || []);
      } else {
        const message = data.message || "Failed to load members";
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  }

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

  useEffect(() => {
    if (activeTab === WORKSPACE_TABS.MEMBERS && !membersLoaded) {
      setMembersLoaded(true);
      fetchMembers(true);
    }
  }, [activeTab, membersLoaded]);

  const handleCancel = () => {
    setFormData({ name: workspace.name || "" });
    setError("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatRole = (role) => {
    if (!role) return "Member";
    return role.charAt(0).toUpperCase() + role.slice(1);
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

  const handleOpenAddMember = () => {
    setMemberForm({ email: "", role: "member" });
    setMemberErrors({});
    setMemberSubmitting(false);
    setIsAddMemberOpen(true);
  };

  const handleCloseAddMember = () => {
    setIsAddMemberOpen(false);
    setMemberForm({ email: "", role: "member" });
    setMemberErrors({});
    setMemberSubmitting(false);
  };

  const handleMemberChange = (event) => {
    const { name, value } = event.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
    setMemberErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleOpenEditMember = (member) => {
    if (!member || !member.id) {
      toast.error("Member data is unavailable");
      return;
    }
    setEditingMember(member);
    setEditForm({ role: member.role || "member" });
    setEditErrors({});
    setEditSubmitting(false);
    setIsEditMemberOpen(true);
  };

  const handleCloseEditMember = () => {
    setIsEditMemberOpen(false);
    setEditingMember(null);
    setEditForm({ role: "member" });
    setEditErrors({});
    setEditSubmitting(false);
  };

  const handleEditMemberChange = (event) => {
    const { value } = event.target;
    setEditForm({ role: value });
    setEditErrors({});
  };

  const handleMemberSubmit = async (event) => {
    event.preventDefault();
    const errors = {};

    if (!memberForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(memberForm.email.trim())) {
      errors.email = "Please enter a valid email";
    }

    if (!memberForm.role) {
      errors.role = "Role is required";
    }

    if (Object.keys(errors).length > 0) {
      setMemberErrors(errors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setMemberSubmitting(true);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: memberForm.email.trim(),
          role: memberForm.role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const message = data.message || "Failed to add member";
        if (res.status === 404 || res.status === 409 || res.status === 400) {
          setMemberErrors((prev) => ({ ...prev, email: message }));
        }
        toast.error(message);
        return;
      }

      await fetchMembers(true);
      toast.success(data.message || "Member added successfully");
      handleCloseAddMember();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add member");
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleEditMemberSubmit = async (event) => {
    event.preventDefault();

    if (!editingMember || !editingMember.id) {
      toast.error("Member data is unavailable");
      return;
    }

    if (!editForm.role) {
      setEditErrors({ role: "Role is required" });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setEditSubmitting(true);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: editingMember.id,
          role: editForm.role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const message = data.message || "Failed to update member";
        setEditErrors({ role: message });
        toast.error(message);
        return;
      }

      await fetchMembers(true);
      toast.success(data.message || "Member updated successfully");
      handleCloseEditMember();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update member");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!member || !member.id) {
      toast.error("Member data is unavailable");
      return;
    }

    if (member.role === "owner") {
      toast.error("Cannot remove the workspace owner");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${
        member.fullName || member.email || "this member"
      } from the workspace?`
    );

    if (!confirmed) {
      return;
    }

    setMemberActionId(member.id);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: member.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to remove member");
        return;
      }

      await fetchMembers(true);
      toast.success(data.message || "Member removed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove member");
    } finally {
      setMemberActionId(null);
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
            <h2 className="card-title">Workspace Settings</h2>
            <div className="workspace-tabs">
              <button
                type="button"
                className={`workspace-tab ${
                  activeTab === WORKSPACE_TABS.DETAILS
                    ? "workspace-tab--active"
                    : ""
                }`}
                onClick={() => setActiveTab(WORKSPACE_TABS.DETAILS)}
              >
                Details
              </button>
              <button
                type="button"
                className={`workspace-tab ${
                  activeTab === WORKSPACE_TABS.MEMBERS
                    ? "workspace-tab--active"
                    : ""
                }`}
                onClick={() => setActiveTab(WORKSPACE_TABS.MEMBERS)}
              >
                Member
              </button>
            </div>
          </div>
        </div>

        {activeTab === WORKSPACE_TABS.DETAILS ? (
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="form-header">
                <h2 className="card-title">Workspace Details</h2>
                <p className="card-subtitle">
                  Update your workspace name and review subscription
                  information.
                </p>
              </div>
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
        ) : (
          <div className="card-body">
            <div className="workspace-member-actions">
              <div>
                <h2 className="card-title">Workspace Members</h2>
                <p className="card-subtitle">
                  Invite teammates and manage their roles.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenAddMember}
              >
                <i className="uil uil-user-plus"></i>
                Add Member
              </button>
            </div>
            <div className="table-container">
              <table className="table workspace-member-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {membersLoading ? (
                    <tr>
                      <td colSpan={3} className="workspace-member-empty">
                        Loading members...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="workspace-member-empty">
                        No members to display yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((member, index) => (
                      <tr key={member.id || member.email || `member-${index}`}>
                        <td>
                          <div className="workspace-member-name">
                            <span className="workspace-member-fullname">
                              {member.fullName || member.email || "Member"}
                            </span>
                            {member.email && (
                              <span className="workspace-member-email">
                                {member.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="workspace-member-role">
                            {formatRole(member.role)}
                          </span>
                        </td>
                        <td className="workspace-member-actions-cell">
                          {member.role === "owner" || !member.id ? (
                            <span className="workspace-member-owner-tag">
                              Owner
                            </span>
                          ) : (
                            <div className="workspace-member-row-actions">
                              <button
                                type="button"
                                className="workspace-member-link-button"
                                onClick={() => handleOpenEditMember(member)}
                                disabled={
                                  editSubmitting ||
                                  memberSubmitting ||
                                  memberActionId === member.id
                                }
                              >
                                <i className="uil uil-edit-alt"></i> Edit
                              </button>
                              <button
                                type="button"
                                className="workspace-member-link-button delete"
                                onClick={() => handleDeleteMember(member)}
                                disabled={
                                  memberActionId === member.id ||
                                  editSubmitting ||
                                  memberSubmitting
                                }
                              >
                                {memberActionId === member.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddMemberOpen && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content workspace-modal">
            <div className="modal-header">
              <h3 className="modal-title">Add Member</h3>
              <button
                type="button"
                className="close"
                onClick={handleCloseAddMember}
                aria-label="Close"
              >
                <i className="uil uil-times"></i>
              </button>
            </div>
            <form onSubmit={handleMemberSubmit}>
              <div className="modal-body workspace-modal-body">
                <div
                  className={`form-group ${
                    memberErrors.email ? "has-error" : ""
                  }`}
                >
                  <label className="form-label" htmlFor="member-email">
                    Email
                  </label>
                  <input
                    id="member-email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="user@example.com"
                    value={memberForm.email}
                    onChange={handleMemberChange}
                  />
                  {memberErrors.email && (
                    <div className="form-error">{memberErrors.email}</div>
                  )}
                </div>
                <div
                  className={`form-group ${
                    memberErrors.role ? "has-error" : ""
                  }`}
                >
                  <label className="form-label" htmlFor="member-role">
                    Role
                  </label>
                  <select
                    id="member-role"
                    name="role"
                    className="form-control"
                    value={memberForm.role}
                    onChange={handleMemberChange}
                  >
                    {WORKSPACE_MEMBER_ROLES.map((roleOption) => (
                      <option key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                  {memberErrors.role && (
                    <div className="form-error">{memberErrors.role}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseAddMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={memberSubmitting}
                >
                  {memberSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditMemberOpen && editingMember && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content workspace-modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Member</h3>
              <button
                type="button"
                className="close"
                onClick={handleCloseEditMember}
                aria-label="Close"
              >
                <i className="uil uil-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditMemberSubmit}>
              <div className="modal-body workspace-modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-member-email">
                    Email
                  </label>
                  <input
                    id="edit-member-email"
                    type="email"
                    className="form-control"
                    value={editingMember.email || ""}
                    disabled
                  />
                </div>
                <div
                  className={`form-group ${editErrors.role ? "has-error" : ""}`}
                >
                  <label className="form-label" htmlFor="edit-member-role">
                    Role
                  </label>
                  <select
                    id="edit-member-role"
                    className="form-control"
                    value={editForm.role}
                    onChange={handleEditMemberChange}
                  >
                    {WORKSPACE_MEMBER_ROLES.map((roleOption) => (
                      <option key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                  {editErrors.role && (
                    <div className="form-error">{editErrors.role}</div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEditMember}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .card-body {
          padding: 24px;
          padding-top: 0;
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
        .workspace-tabs {
          display: inline-flex;
          gap: 8px;
          padding: 8px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-secondary);
          margin-top: 16px;
        }
        .workspace-tab {
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          padding: 6px 16px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .workspace-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .workspace-tab--active {
          color: var(--accent-primary);
          background: var(--bg-primary);
          border-color: var(--accent-primary);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .workspace-member-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 16px;
        }
        .workspace-member-actions .card-title {
          margin-bottom: 4px;
        }
        .workspace-member-actions .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .workspace-member-table th:nth-child(3),
        .workspace-member-table td:nth-child(3) {
          text-align: right;
        }
        .workspace-member-empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--text-muted);
        }
        .workspace-member-name {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .workspace-member-fullname {
          font-weight: 600;
          color: var(--text-primary);
        }
        .workspace-member-email {
          font-size: 12px;
          color: var(--text-muted);
        }
        .workspace-member-role {
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          color: var(--text-secondary);
        }
        .workspace-member-actions-cell {
          color: var(--text-muted);
          font-size: 12px;
        }
        .workspace-member-owner-tag {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-primary);
        }
        .workspace-member-row-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .workspace-member-link-button {
          border: none;
          background: transparent;
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }
        .workspace-member-link-button.delete {
          color: var(--accent-red);
        }
        .workspace-member-link-button:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }
        .workspace-modal {
          max-width: 420px;
          width: 100%;
        }
        .workspace-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .has-error .form-control {
          border-color: var(--accent-red);
        }
        .form-error {
          margin-top: 6px;
          font-size: 12px;
          color: var(--accent-red);
        }
      `}</style>
    </div>
  );
}
