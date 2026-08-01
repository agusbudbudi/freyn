"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import workspacePermissionsConfig from "@/lib/workspacePermissions.json";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";

const DEFAULT_WORKSPACE = {
  id: null,
  name: "",
  slug: "",
  plan: "",
  status: "",
  ownerName: "",
  permissions: null,
};

const WORKSPACE_TABS = {
  DETAILS: "details",
  MEMBERS: "members",
  PERMISSIONS: "permissions",
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
  const [userRole, setUserRole] = useState("member");
  const [permissionsData, setPermissionsData] = useState({
    roles: [],
    menus: [],
  });
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState("");
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionEditRole, setPermissionEditRole] = useState(null);
  const [permissionSelections, setPermissionSelections] = useState([]);
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [permissionModalError, setPermissionModalError] = useState("");

  useEffect(() => {
    fetchWorkspace();
  }, []);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser?.workspaceRole) {
          setUserRole(parsedUser.workspaceRole);
        }
      }
    } catch (error) {
      console.error("Failed to read workspace role", error);
    }
  }, []);

  const hasChanges = useMemo(() => {
    if (!workspace || !workspace.name) {
      return Boolean(formData.name.trim());
    }
    return formData.name.trim() !== (workspace.name || "");
  }, [formData.name, workspace]);

  const getAuthToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const menuOptions = useMemo(() => {
    if (Array.isArray(permissionsData.menus) && permissionsData.menus.length) {
      return permissionsData.menus;
    }
    return Array.isArray(workspacePermissionsConfig?.menuItems)
      ? workspacePermissionsConfig.menuItems
      : [];
  }, [permissionsData.menus]);

  const fetchMembers = useCallback(
    async (force = false) => {
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
    },
    [membersLoading]
  );

  const fetchPermissions = useCallback(
    async (force = false) => {
      if (userRole !== "owner") {
        setPermissionsError(
          "Only workspace owners can manage role permissions."
        );
        return;
      }

      if (permissionsLoading && !force) {
        return;
      }

      setPermissionsLoading(true);
      setPermissionsError("");

      try {
        const token = getAuthToken();
        if (!token) {
          setPermissionsError("Authentication required");
          setPermissionsLoading(false);
          return;
        }

        const res = await fetch("/api/workspace/permissions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const roles = Array.isArray(data.data?.roles) ? data.data.roles : [];
          const menus = Array.isArray(data.data?.menus) ? data.data.menus : [];
          const permissions = data.data?.permissions;

          setPermissionsData({ roles, menus });

          if (permissions) {
            setWorkspace((prev) => ({
              ...prev,
              permissions,
            }));

            try {
              const cachedWorkspace = JSON.parse(
                localStorage.getItem("workspace") || "{}"
              );
              localStorage.setItem(
                "workspace",
                JSON.stringify({ ...cachedWorkspace, permissions })
              );
            } catch (storageError) {
              console.error("Failed to update cached workspace", storageError);
            }
          }
        } else {
          const message = data.message || "Failed to load permissions";
          setPermissionsError(message);
          toast.error(message);
        }
      } catch (error) {
        console.error(error);
        setPermissionsError("Failed to load permissions");
        toast.error("Failed to load permissions");
      } finally {
        setPermissionsLoading(false);
      }
    },
    [permissionsLoading, userRole]
  );

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

    if (
      activeTab === WORKSPACE_TABS.PERMISSIONS &&
      !permissionsLoaded &&
      userRole === "owner"
    ) {
      setPermissionsLoaded(true);
      fetchPermissions(true);
    }
  }, [
    activeTab,
    membersLoaded,
    permissionsLoaded,
    userRole,
    fetchMembers,
    fetchPermissions,
  ]);

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

    if (userRole !== "owner") {
      const message = "Only workspace owners can edit workspace details";
      setError(message);
      toast.error(message);
      return;
    }

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
      `Remove ${member.fullName || member.email || "this member"
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

  const handleOpenPermissionModal = (role) => {
    if (!role || !role.editable) {
      return;
    }

    setPermissionEditRole(role);
    setPermissionSelections(role.permissions || []);
    setPermissionModalError("");
    setPermissionSubmitting(false);
    setIsPermissionModalOpen(true);
  };

  const handleClosePermissionModal = () => {
    setIsPermissionModalOpen(false);
    setPermissionEditRole(null);
    setPermissionSelections([]);
    setPermissionSubmitting(false);
    setPermissionModalError("");
  };

  const handleTogglePermission = (key) => {
    setPermissionSelections((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const handleSelectAllPermissions = () => {
    setPermissionSelections(menuOptions.map((menu) => menu.key));
  };

  const handleClearPermissions = () => {
    setPermissionSelections([]);
  };

  const handleSubmitPermissions = async (event) => {
    event.preventDefault();

    if (!permissionEditRole) {
      toast.error("Role information is unavailable");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setPermissionSubmitting(true);
    setPermissionModalError("");

    try {
      const res = await fetch("/api/workspace/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: permissionEditRole.key,
          permissions: permissionSelections,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const message = data.message || "Failed to update permissions";
        setPermissionModalError(message);
        toast.error(message);
        return;
      }

      const roles = Array.isArray(data.data?.roles)
        ? data.data.roles
        : permissionsData.roles;
      const permissions = data.data?.permissions;

      setPermissionsData((prev) => ({
        roles,
        menus: prev.menus,
      }));

      if (permissions) {
        setWorkspace((prev) => ({
          ...prev,
          permissions,
        }));

        try {
          const cachedWorkspace = JSON.parse(
            localStorage.getItem("workspace") || "{}"
          );
          const updatedWorkspace = {
            ...cachedWorkspace,
            permissions,
          };
          localStorage.setItem("workspace", JSON.stringify(updatedWorkspace));

          const workspaceId =
            updatedWorkspace.id || workspace.id || cachedWorkspace.id || null;

          window.dispatchEvent(
            new CustomEvent("workspace-permissions-updated", {
              detail: {
                workspaceId,
              },
            })
          );
        } catch (storageError) {
          console.error("Failed to update workspace cache", storageError);
        }
      }

      toast.success(data.message || "Permissions updated successfully");
      handleClosePermissionModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update permissions");
      setPermissionModalError("Failed to update permissions");
    } finally {
      setPermissionSubmitting(false);
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
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      {error && (
        <div className="flex items-center gap-2 py-3 px-3.5 rounded-[10px] bg-red-500/[0.12] text-red-500 mb-4 text-[13px]">
          <i className="uil uil-exclamation-triangle text-base"></i>
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Workspace Management</CardTitle>
            <Tabs
              className="mt-4"
              tabs={[
                { value: WORKSPACE_TABS.DETAILS, label: "Details" },
                { value: WORKSPACE_TABS.MEMBERS, label: "Member" },
                { value: WORKSPACE_TABS.PERMISSIONS, label: "Permission" },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </CardHeader>

        {activeTab === WORKSPACE_TABS.DETAILS ? (
          <form onSubmit={handleSubmit}>
            <CardBody className="p-6 pt-0">
              <div className="mb-5">
                <CardTitle>Details</CardTitle>
                <CardSubtitle className="text-sm mt-1">
                  Update your workspace name and review subscription
                  information.
                </CardSubtitle>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 items-start">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="workspace-name">
                    Workspace Name
                  </label>
                  <Input
                    id="workspace-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter workspace name"
                    maxLength={120}
                    disabled={userRole !== "owner"}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="workspace-plan">
                    Workspace Plan
                  </label>
                  <Input
                    id="workspace-plan"
                    type="text"
                    value={displayPlan}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="workspace-slug">
                    Slug
                  </label>
                  <Input
                    id="workspace-slug"
                    type="text"
                    value={workspace.slug || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="workspace-owner">
                    Owner
                  </label>
                  <Input
                    id="workspace-owner"
                    type="text"
                    value={workspace.ownerName || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="workspace-status">
                    Status
                  </label>
                  <Input
                    id="workspace-status"
                    type="text"
                    value={displayStatus}
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </CardBody>

            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !hasChanges}>
                  <i className="uil uil-save"></i>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        ) : activeTab === WORKSPACE_TABS.MEMBERS ? (
          <CardBody className="p-6 pt-0">
            <div className="flex justify-between items-end gap-4 mb-4">
              <div>
                <CardTitle className="mb-1">Members</CardTitle>
                <CardSubtitle className="text-sm">
                  Invite teammates and manage their roles.
                </CardSubtitle>
              </div>
              <Button onClick={handleOpenAddMember}>
                <i className="uil uil-user-plus"></i>
                Add Member
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="py-4 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Name</th>
                    <th className="py-4 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Role</th>
                    <th className="py-4 px-5 text-right bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {membersLoading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 px-4 text-slate-500">
                        Loading members...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 px-4 text-slate-500">
                        No members to display yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((member, index) => (
                      <tr key={member.id || member.email || `member-${index}`}>
                        <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900">
                              {member.fullName || member.email || "Member"}
                            </span>
                            {member.email && (
                              <span className="text-xs text-slate-500">
                                {member.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <span className="text-xs font-medium capitalize text-slate-800">
                            {formatRole(member.role)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs text-right text-slate-500">
                          {member.role === "owner" || !member.id ? (
                            <span className="text-xs font-semibold text-signal-blue">
                              Owner
                            </span>
                          ) : (
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                className="border-none bg-transparent text-signal-blue text-xs font-medium cursor-pointer p-0 inline-flex items-center gap-1.5 disabled:text-slate-500 disabled:cursor-not-allowed"
                                onClick={() => handleOpenEditMember(member)}
                                disabled={
                                  editSubmitting ||
                                  memberSubmitting ||
                                  memberActionId === member.id
                                }
                              >
                                <i className="uil uil-edit-alt text-sm"></i> Edit
                              </button>
                              <button
                                type="button"
                                className="border-none bg-transparent text-red-500 text-xs font-medium cursor-pointer p-0 inline-flex items-center gap-1.5 disabled:text-slate-500 disabled:cursor-not-allowed"
                                onClick={() => handleDeleteMember(member)}
                                disabled={
                                  memberActionId === member.id ||
                                  editSubmitting ||
                                  memberSubmitting
                                }
                              >
                                {memberActionId === member.id ? (
                                  "Deleting..."
                                ) : (
                                  <>
                                    <i className="uil uil-trash-alt text-sm"></i>
                                    Delete
                                  </>
                                )}
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
          </CardBody>
        ) : (
          <CardBody className="p-6 pt-0">
            <div className="flex justify-between items-end mb-4">
              <div>
                <CardTitle>Permissions</CardTitle>
                <CardSubtitle className="text-sm">
                  Control which menus each role can access in the sidebar.
                </CardSubtitle>
              </div>
            </div>

            {userRole !== "owner" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-100 text-amber-800 mt-4 text-sm">
                <i className="uil uil-lock text-2xl text-amber-800"></i>
                <div>
                  <h4 className="m-0">Permission management is restricted</h4>
                  <p className="text-xs m-0">Only workspace owners can manage menu permissions.</p>
                </div>
              </div>
            ) : permissionsLoading && !permissionsData.roles.length ? (
              <div className="text-center py-6 px-3 text-slate-500 text-sm">
                Loading permissions...
              </div>
            ) : permissionsError && !permissionsData.roles.length ? (
              <div className="text-center py-6 px-3 text-slate-500 text-sm">
                {permissionsError}
              </div>
            ) : (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="py-4 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Role Name</th>
                        <th className="py-4 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Menu Access</th>
                        <th className="py-4 px-5 text-right bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsData.roles.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-6 px-3 text-slate-500 text-sm">
                            No role permissions found.
                          </td>
                        </tr>
                      ) : (
                        permissionsData.roles.map((role) => {
                          const preview = role.permissions || [];
                          const previewLimit = 3;
                          const previewList = preview.slice(0, previewLimit);
                          const remainder = preview.length - previewList.length;

                          return (
                            <tr key={role.key}>
                              <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs align-top">{role.name}</td>
                              <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs align-top">
                                {previewList.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {previewList.map((permKey) => {
                                      const label =
                                        menuOptions.find(
                                          (menu) => menu.key === permKey
                                        )?.label || permKey;
                                      return (
                                        <span
                                          key={`${role.key}-${permKey}`}
                                          className="inline-flex items-center py-1 px-2.5 rounded-full bg-white text-[11px] text-slate-800 border border-slate-100"
                                        >
                                          {label}
                                        </span>
                                      );
                                    })}
                                    {remainder > 0 && (
                                      <span className="inline-flex items-center py-1 px-2.5 rounded-full bg-slate-50 text-[11px] text-signal-blue border border-signal-blue/25">
                                        +{remainder}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[13px]">
                                    No menu access
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-3 pl-5 border-b border-slate-100 text-xs align-top text-right">
                                <button
                                  type="button"
                                  className="border-none bg-transparent text-signal-blue text-xs font-medium cursor-pointer p-0 inline-flex items-center gap-1.5 disabled:text-slate-500 disabled:cursor-not-allowed"
                                  onClick={() => handleOpenPermissionModal(role)}
                                  disabled={!role.editable || permissionsLoading}
                                >
                                  {role.editable ? (
                                    <>
                                      <i className="uil uil-edit-alt text-sm"></i>
                                      Edit
                                    </>
                                  ) : (
                                    <>
                                      <i className="uil uil-lock text-sm"></i>
                                      Locked
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {permissionsError && (
                  <div className="mt-3 py-2.5 px-3 rounded-lg bg-red-500/[0.12] text-red-500 flex items-center gap-2 text-xs">
                    <i className="uil uil-exclamation-triangle"></i>
                    {permissionsError}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        )}
      </Card>

      {isAddMemberOpen && (
        <Modal title="Add Member" onClose={handleCloseAddMember} maxWidth="420px">
          <form onSubmit={handleMemberSubmit}>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="member-email">
                  Email
                </label>
                <Input
                  id="member-email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={memberForm.email}
                  onChange={handleMemberChange}
                  className={memberErrors.email ? "border-red-500" : ""}
                />
                {memberErrors.email && (
                  <div className="mt-1.5 text-xs text-red-500">{memberErrors.email}</div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="member-role">
                  Role
                </label>
                <Select
                  id="member-role"
                  name="role"
                  value={memberForm.role}
                  onChange={handleMemberChange}
                  className={memberErrors.role ? "border-red-500" : ""}
                >
                  {WORKSPACE_MEMBER_ROLES.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </Select>
                {memberErrors.role && (
                  <div className="mt-1.5 text-xs text-red-500">{memberErrors.role}</div>
                )}
              </div>
            </div>
            <div className="py-2.5 px-6 border-t border-slate-100 flex justify-end gap-2.5">
              <Button type="button" variant="secondary" onClick={handleCloseAddMember}>
                Cancel
              </Button>
              <Button type="submit" disabled={memberSubmitting}>
                {memberSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isEditMemberOpen && editingMember && (
        <Modal title="Edit Member" onClose={handleCloseEditMember} maxWidth="420px">
          <form onSubmit={handleEditMemberSubmit}>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="edit-member-email">
                  Email
                </label>
                <Input
                  id="edit-member-email"
                  type="email"
                  value={editingMember.email || ""}
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="edit-member-role">
                  Role
                </label>
                <Select
                  id="edit-member-role"
                  value={editForm.role}
                  onChange={handleEditMemberChange}
                  className={editErrors.role ? "border-red-500" : ""}
                >
                  {WORKSPACE_MEMBER_ROLES.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </Select>
                {editErrors.role && (
                  <div className="mt-1.5 text-xs text-red-500">{editErrors.role}</div>
                )}
              </div>
            </div>
            <div className="py-2.5 px-6 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseEditMember}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isPermissionModalOpen && permissionEditRole && (
        <Modal title="Edit Permissions" onClose={handleClosePermissionModal} maxWidth="520px">
          <form onSubmit={handleSubmitPermissions}>
            <div className="p-6 flex flex-col gap-4">
              <div className="text-[13px] text-slate-800">
                Role: <strong>{permissionEditRole.name}</strong>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="border-none p-0 bg-transparent text-signal-blue text-xs font-medium cursor-pointer hover:underline"
                  onClick={handleSelectAllPermissions}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="border-none p-0 bg-transparent text-signal-blue text-xs font-medium cursor-pointer hover:underline"
                  onClick={handleClearPermissions}
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
                {menuOptions.map((menu) => {
                  const isChecked = permissionSelections.includes(menu.key);
                  return (
                    <div
                      key={menu.key}
                      className="flex items-center gap-2 bg-slate-50 rounded-[10px] py-2.5 px-3 text-xs text-slate-800"
                    >
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox-modern"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(menu.key)}
                        />
                        <span className="cursor-pointer select-none">
                          {menu.label}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              {permissionModalError && (
                <div className="py-2.5 px-3 rounded-lg bg-red-500/[0.12] text-red-500 flex items-center gap-2 text-xs">
                  <i className="uil uil-exclamation-triangle"></i>
                  {permissionModalError}
                </div>
              )}
            </div>
            <div className="py-2.5 px-6 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClosePermissionModal}
                disabled={permissionSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={permissionSubmitting}>
                {permissionSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
