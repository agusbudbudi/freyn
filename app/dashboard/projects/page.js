"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import Pagination from "@/components/Pagination";
import StatusFilter from "@/components/StatusFilter";
import { usePagination } from "@/lib/hooks/usePagination";
import { useStatusFilter } from "@/lib/hooks/useStatusFilter";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button, { buttonClasses } from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const goToProject = (project = null) => {
    if (project) {
      router.push(`/dashboard/projects/${project._id}/edit`);
    } else {
      router.push("/dashboard/projects/add");
    }
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
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card>
          <CardBody className="p-6">
            <div className="text-center py-8 text-red-500">
              <i className="uil uil-exclamation-triangle text-3xl"></i>
              <p>{error}</p>
              <Button onClick={fetchProjects} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <CardHeader className="flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput
              placeholder="Search projects by name, client, order no, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
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
          <div className="flex gap-2">
            <Link
              href="/dashboard/projects/calendar"
              className={buttonClasses({ variant: "outline" })}
            >
              <i className="uil uil-schedule"></i>
              Calendar
            </Link>
            <Button onClick={() => goToProject()}>
              <i className="uil uil-plus"></i>
              Add
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon="uil uil-folder-open"
              title={searchTerm ? "No projects found" : "No projects yet"}
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Start by adding your first project"
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Order No", "Project Name", "Client", "Due Date", "Total Price", "Deliverables", "Status", "Actions"].map((h) => (
                        <th key={h} className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProjects.map((project) => (
                      <tr key={project._id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 [&:last-child_td]:border-b-0">
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <a
                            href="#"
                            className="text-blue-500 no-underline cursor-pointer whitespace-nowrap hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              goToProject(project);
                            }}
                          >
                            <strong>{project.numberOrder}</strong>
                          </a>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <div className="font-semibold text-slate-800 mb-1 text-xs">
                            {project.projectName}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{project.clientName}</td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <div>{formatDate(project.deadline)}</div>
                          {project.status?.toLowerCase() !== "done" &&
                            getOverdueDays(project.deadline) > 0 && (
                              <span className="inline-block mt-1 py-0.5 px-1.5 rounded-full text-[10px] leading-[1.4] text-red-800 bg-red-100 border border-red-200">
                                Overdue {getOverdueDays(project.deadline)}{" "}
                                {getOverdueDays(project.deadline) > 1
                                  ? "days"
                                  : "day"}
                              </span>
                            )}
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs font-bold text-emerald-600">
                          {formatCurrency(project.totalPrice)}
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <a
                            href={`/result/${project._id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-blue-500 no-underline hover:underline"
                          >
                            <i className="uil uil-external-link-alt"></i>
                            View Result
                          </a>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <StatusBadge status={getStatusClass(project.status)}>
                            {getStatusLabel(project.status)}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <div
                            className="relative inline-block"
                            ref={
                              openActionId === project._id ? actionMenuRef : null
                            }
                          >
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 border-none rounded-lg cursor-pointer transition-all duration-200 text-base bg-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
                                className="absolute right-0 min-w-[180px] bg-white border border-slate-100 rounded-xl shadow-[0_5px_10px_rgba(15,23,42,0.05)] p-2 z-10"
                                style={
                                  actionMenuPlacement === "top"
                                    ? { ...actionMenuStyle, transformOrigin: "bottom right" }
                                    : actionMenuStyle
                                }
                              >
                                <button
                                  type="button"
                                  className="w-full border-none bg-transparent text-slate-900 text-xs font-medium flex items-center gap-2 py-2 px-3.5 cursor-pointer whitespace-nowrap rounded-lg hover:bg-slate-50"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    goToProject(project);
                                  }}
                                >
                                  <i className="uil uil-edit-alt text-base"></i>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="w-full border-none bg-transparent text-slate-900 text-xs font-medium flex items-center gap-2 py-2 px-3.5 cursor-pointer whitespace-nowrap rounded-lg hover:bg-slate-50"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleShareWhatsApp(project);
                                  }}
                                >
                                  <i className="uil uil-whatsapp text-base"></i>
                                  Share to WhatsApp
                                </button>
                                <button
                                  type="button"
                                  className="w-full border-none bg-transparent text-red-500 text-xs font-medium flex items-center gap-2 py-2 px-3.5 cursor-pointer whitespace-nowrap rounded-lg hover:bg-slate-50 hover:text-red-600"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    deleteProject(project._id);
                                  }}
                                >
                                  <i className="uil uil-trash-alt text-base"></i>
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
                <div className="flex justify-center p-4 border-t border-slate-100">
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
        </CardBody>
      </Card>
    </div>
  );
}
