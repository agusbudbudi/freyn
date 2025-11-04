"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ProjectModal from "../../../components/ProjectModal";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import Pagination from "@/components/Pagination";
import StatusFilter from "@/components/StatusFilter";
import { usePagination } from "@/lib/hooks/usePagination";
import { useStatusFilter } from "@/lib/hooks/useStatusFilter";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPlacement, setActionMenuPlacement] = useState("bottom");
  const [actionMenuStyle, setActionMenuStyle] = useState({});
  const actionMenuRef = useRef(null);
  const actionTriggerRef = useRef(null);

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setProjects(data.data.projects);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch projects");
      toast.error("Failed to fetch projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useWorkspaceSwitchListener(fetchProjects);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate overdue days (0 if not overdue)
  const getOverdueDays = (dateStr) => {
    const due = new Date(dateStr);
    const today = new Date();
    // normalize to start of day to avoid off-by-one
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - due) / 86400000);
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusClass = (status) => {
    const statusMap = {
      "to do": "status-todo",
      "in progress": "status-progress",
      "waiting for payment": "status-waiting",
      "in review": "status-review",
      revision: "status-revision",
      done: "status-done",
    };
    return statusMap[status] || "status-progress";
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      "to do": "To Do",
      "in progress": "In Progress",
      "waiting for payment": "Waiting Payment",
      "in review": "In Review",
      revision: "Revision",
      done: "Done",
    };
    return labelMap[status] || status;
  };

  const openModal = (project = null) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  useEffect(() => {
    if (!openActionId) {
      setActionMenuPlacement("bottom");
      setActionMenuStyle({});
      return;
    }

    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        actionMenuRef.current.contains(event.target)
      ) {
        return;
      }
      if (
        actionTriggerRef.current &&
        actionTriggerRef.current.contains(event.target)
      ) {
        return;
      }
      setOpenActionId(null);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenActionId(null);
      }
    };

    const updatePlacement = () => {
      if (!actionMenuRef.current) return;
      const tray = actionMenuRef.current.querySelector(".action-menu__tray");
      const trigger = actionTriggerRef.current;
      if (!tray || !trigger) return;

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const triggerRect = trigger.getBoundingClientRect();
      const trayHeight = tray.scrollHeight;
      const gap = 8;
      const margin = 12;
      const spaceBelow = Math.max(viewportHeight - triggerRect.bottom - margin, 0);
      const spaceAbove = Math.max(triggerRect.top - margin, 0);

      let nextPlacement = "bottom";
      if (spaceBelow >= trayHeight) {
        nextPlacement = "bottom";
      } else if (spaceAbove >= trayHeight) {
        nextPlacement = "top";
      } else {
        nextPlacement = spaceBelow >= spaceAbove ? "bottom" : "top";
      }

      const maxHeight =
        nextPlacement === "bottom" ? spaceBelow || undefined : spaceAbove || undefined;

      setActionMenuStyle((prev) => {
        const style =
          nextPlacement === "top"
            ? {
                top: "auto",
                bottom: `calc(100% + ${gap}px)`
              }
            : {
                top: `calc(100% + ${gap}px)`,
                bottom: "auto"
              };
        if (maxHeight) {
          style.maxHeight = `${Math.max(maxHeight, 120)}px`;
          style.overflowY = "auto";
        } else {
          delete style.maxHeight;
          delete style.overflowY;
        }
        return style;
      });

      setActionMenuPlacement((prev) =>
        prev === nextPlacement ? prev : nextPlacement
      );
    };

    const rafId = requestAnimationFrame(updatePlacement);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      cancelAnimationFrame(rafId);
    };
  }, [openActionId]);

  const handleSave = (updatedProject, meta) => {
    if (meta?.source === "comment") {
      if (updatedProject) {
        setEditingProject(updatedProject);
        // keep table data in sync without full refetch
        setProjects((prev) =>
          prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      }
      return; // avoid full refetch on comment submit
    }
    // Normal save: refresh list and close modal
    fetchProjects(); // Refresh the main projects list
    if (updatedProject) {
      // Optimistically update local list to reflect changes immediately
      setProjects((prev) =>
        prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
      );
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const deleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh projects list
        fetchProjects();
        toast.success("Project deleted successfully");
      } else {
        toast.error("Failed to delete project: " + data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete project");
    }
  };

  const toggleActionMenu = (projectId) => {
    setActionMenuPlacement("bottom");
    setActionMenuStyle({});
    setOpenActionId((prev) => (prev === projectId ? null : projectId));
  };

  const normalizePhone = (p) => {
    const digits = (p || "").toString().replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return digits;
  };

  const handleShareWhatsApp = (project) => {
    const phone = project?.clientPhone;
    if (!phone) {
      toast.error("Client phone number is missing");
      return;
    }
    const normalized = normalizePhone(phone);
    if (!normalized) {
      toast.error("Client phone number is invalid");
      return;
    }
    const link = `${window.location.origin}/result/${project._id}`;
    const message = `Hi ${project.clientName}, The project progress is now available. you can monitor it at the link below:\n• Open Project Result: ${link}`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.projectName?.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q) ||
      p.numberOrder?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  });

  const statusFilter = useStatusFilter(filteredProjects, {
    order: [
      "to do",
      "in progress",
      "waiting for payment",
      "in review",
      "revision",
      "done",
    ],
    formatLabel: (status) => {
      const labelMap = {
        "to do": "To Do",
        "in progress": "In Progress",
        "waiting for payment": "Waiting Payment",
        "in review": "In Review",
        revision: "Revision",
        done: "Done",
      };
      return labelMap[status] || status;
    },
  });

  const pagination = usePagination(statusFilter.filteredItems, 10);
  useEffect(() => {
    pagination.goToPage(1);
    statusFilter.setActiveStatus("all");
  }, [searchTerm]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [statusFilter.activeStatus]);
  const displayedProjects = pagination.pageItems;

  if (loading) {
    return (
      <div className="content-body">
        <LoadingState message="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-body">
        <div className="content-card">
          <div className="card-body">
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#ef4444" }}
            >
              <i
                className="uil uil-exclamation-triangle"
                style={{ fontSize: "2rem" }}
              ></i>
              <p>{error}</p>
              <button
                onClick={fetchProjects}
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">All Projects</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/dashboard/projects/calendar"
              className="btn btn-outline"
            >
              <i className="uil uil-schedule"></i>
              Calendar
            </Link>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <i className="uil uil-plus"></i>
              Add
            </button>
          </div>
        </div>

        <div className="card-header-search">
          <div className="search-input-container">
            <i className="uil uil-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search projects by name, client, order no, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                style={{ display: "flex" }}
              >
                <i className="uil uil-times"></i>
              </button>
            )}
          </div>
          {filteredProjects.length > 0 && (
            <StatusFilter
              options={statusFilter.options}
              value={statusFilter.activeStatus}
              onChange={(value) => {
                statusFilter.setActiveStatus(value);
                pagination.goToPage(1);
              }}
            />
          )}
        </div>

        <div className="card-body">
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <i className="uil uil-folder-open"></i>
              <h3>{searchTerm ? "No projects found" : "No projects yet"}</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first project"}
              </p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Project Name</th>
                      <th>Client</th>
                      <th>Due Date</th>
                      <th>Total Price</th>
                      <th>Deliverables</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProjects.map((project) => (
                      <tr key={project._id}>
                      <td>
                        <a
                          href="#"
                          className="link"
                          onClick={(e) => {
                            e.preventDefault();
                            openModal(project);
                          }}
                        >
                          <strong>{project.numberOrder}</strong>
                        </a>
                      </td>
                      <td>
                        <div className="project-name">
                          {project.projectName}
                        </div>
                      </td>
                      <td>{project.clientName}</td>
                      <td>
                        <div>{formatDate(project.deadline)}</div>
                        {project.status?.toLowerCase() !== "done" &&
                          getOverdueDays(project.deadline) > 0 && (
                            <span
                              className="overdue-badge"
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                              }}
                            >
                              Overdue {getOverdueDays(project.deadline)}{" "}
                              {getOverdueDays(project.deadline) > 1
                                ? "days"
                                : "day"}
                            </span>
                          )}
                      </td>
                      <td className="currency">
                        {formatCurrency(project.totalPrice)}
                      </td>
                      <td>
                        <a
                          href={`/result/${project._id}`}
                          target="_blank"
                          className="link"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="uil uil-external-link-alt"></i>
                          View Result
                        </a>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            project.status
                          )}`}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td>
                        <div
                          className="action-menu"
                          ref={
                            openActionId === project._id ? actionMenuRef : null
                          }
                        >
                          <button
                            type="button"
                            className="action-menu__trigger"
                            aria-haspopup="true"
                            aria-expanded={openActionId === project._id}
                            title="Actions"
                            onClick={() => toggleActionMenu(project._id)}
                            ref={
                              openActionId === project._id
                                ? actionTriggerRef
                                : null
                            }
                          >
                            <i className="uil uil-ellipsis-h"></i>
                          </button>
                          {openActionId === project._id && (
                            <div
                              className={`action-menu__tray ${
                                actionMenuPlacement === "top"
                                  ? "action-menu__tray--dropup"
                                  : ""
                              }`}
                              style={actionMenuStyle}
                            >
                              <button
                                type="button"
                                className="action-menu__item"
                                onClick={() => {
                                  setOpenActionId(null);
                                  openModal(project);
                                }}
                              >
                                <i className="uil uil-edit-alt"></i>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="action-menu__item"
                                onClick={() => {
                                  setOpenActionId(null);
                                  handleShareWhatsApp(project);
                                }}
                              >
                                <i className="uil uil-whatsapp"></i>
                                Share to WhatsApp
                              </button>
                              <button
                                type="button"
                                className="action-menu__item action-menu__item--danger"
                                onClick={() => {
                                  setOpenActionId(null);
                                  deleteProject(project._id);
                                }}
                              >
                                <i className="uil uil-trash-alt"></i>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="pagination-wrapper">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.goToPage}
                    hasNextPage={pagination.hasNextPage}
                    hasPreviousPage={pagination.hasPreviousPage}
                    paginationRange={pagination.paginationRange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editProject={editingProject}
      />
    </div>
  );
}
