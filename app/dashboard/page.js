"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import PieChart from "@/components/charts/PieChart";
import DoughnutChart from "@/components/charts/DoughnutChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import ProjectModal from "@/components/ProjectModal";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/projects/stats/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (project) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined;

      const res = await fetch(`/api/projects/${project.id}`, {
        headers,
      });
      const data = await res.json();
      if (data.success && data.data?.project) {
        setSelectedProject(data.data.project);
        setIsProjectModalOpen(true);
      } else {
        toast.error(data.message || "Failed to load project details");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load project details");
    }
  };

  const handleCloseModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveProject = async (updatedProject, meta) => {
    // If comment was added from modal, refresh only the comment list in the modal
    if (meta?.source === "comment") {
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }
      return; // avoid full dashboard refetch
    }
    // Close modal immediately on successful save, then refresh dashboard data
    setIsProjectModalOpen(false);
    setSelectedProject(null);
    await fetchDashboardData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatStatus = (status) => {
    const statusMap = {
      "to do": { label: "To Do", class: "status-todo" },
      "in progress": { label: "In Progress", class: "status-progress" },
      "waiting for payment": {
        label: "Waiting Payment",
        class: "status-payment",
      },
      "in review": { label: "In Review", class: "status-review" },
      revision: { label: "Revision", class: "status-revision" },
      done: { label: "Done", class: "status-done" },
    };
    return statusMap[status] || { label: status, class: "status-todo" };
  };

  // Prepare chart data
  const getStatusChartData = () => {
    if (!dashboardData?.statusDistribution) return null;

    const statusColors = {
      "to do": "#94a3b8",
      "in progress": "#3b82f6",
      "waiting for payment": "#f59e0b",
      "in review": "#8b5cf6",
      revision: "#ef4444",
      done: "#10b981",
    };

    const labels = Object.keys(dashboardData.statusDistribution).map(
      (status) => {
        const formatted = formatStatus(status);
        return formatted.label;
      }
    );

    const data = Object.values(dashboardData.statusDistribution);
    const backgroundColor = Object.keys(dashboardData.statusDistribution).map(
      (status) => statusColors[status] || "#94a3b8"
    );

    return {
      labels,
      datasets: [
        {
          label: "Projects",
          data,
          backgroundColor,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  const getRevenueChartData = () => {
    if (!dashboardData?.monthlyData) return null;

    return {
      labels: dashboardData.monthlyData.map((m) => m.label),
      datasets: [
        {
          label: "Revenue (Rp)",
          data: dashboardData.monthlyData.map((m) => m.revenue),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getProjectsChartData = () => {
    if (!dashboardData?.monthlyData) return null;

    return {
      labels: dashboardData.monthlyData.map((m) => m.label),
      datasets: [
        {
          label: "Projects",
          data: dashboardData.monthlyData.map((m) => m.projects),
          backgroundColor: "#4f46e5",
          borderRadius: 8,
        },
      ],
    };
  };

  const getTopClientsChartData = () => {
    if (!dashboardData?.topClients) return null;

    return {
      labels: dashboardData.topClients.map((c) => c.name),
      datasets: [
        {
          label: "Projects",
          data: dashboardData.topClients.map((c) => c.count),
          backgroundColor: [
            "#4f46e5",
            "#06b6d4",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
          ],
          borderRadius: 8,
        },
      ],
    };
  };

  const getTopClientsRevenueChartData = () => {
    if (!dashboardData?.topClients) return null;

    const hasRevenue = dashboardData.topClients.some((c) => c.revenue);
    if (!hasRevenue) {
      return null;
    }

    return {
      labels: dashboardData.topClients.map((c) => c.name),
      datasets: [
        {
          label: "Revenue (Rp)",
          data: dashboardData.topClients.map((c) => c.revenue || 0),
          backgroundColor: [
            "#6366f1",
            "#14b8a6",
            "#f97316",
            "#8b5cf6",
            "#22d3ee",
          ],
          borderRadius: 8,
        },
      ],
    };
  };

  const getRevenueSplitChartData = () => {
    const ongoing = dashboardData?.stats?.ongoingRevenue || 0;
    const completed = dashboardData?.stats?.completedRevenue || 0;

    if (!ongoing && !completed) {
      return null;
    }

    return {
      labels: ["Ongoing Revenue", "Completed Revenue"],
      datasets: [
        {
          data: [ongoing, completed],
          backgroundColor: ["#06b6d4", "#10b981"],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="content-body">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-body">
        <div className="alert alert-error">
          <i className="uil uil-exclamation-triangle"></i> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="content-body">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-header">
            <div>
              <div className="stat-number">
                {dashboardData?.stats?.total || 0}
              </div>
              <div className="stat-label">Total Projects</div>
            </div>
            <div className="stat-icon total">
              <i className="uil uil-folder-open"></i>
            </div>
          </div>
        </div>

        <div className="stat-card ongoing">
          <div className="stat-header">
            <div>
              <div className="stat-number">
                {dashboardData?.stats?.ongoing || 0}
              </div>
              <div className="stat-label">Ongoing Projects</div>
            </div>
            <div className="stat-icon ongoing">
              <i className="uil uil-clock-three"></i>
            </div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-header">
            <div>
              <div className="stat-number">
                {dashboardData?.stats?.completed || 0}
              </div>
              <div className="stat-label">Completed Projects</div>
            </div>
            <div className="stat-icon completed">
              <i className="uil uil-check-circle"></i>
            </div>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-header">
            <div>
              <div className="stat-number currency">
                {formatCurrency(dashboardData?.stats?.totalRevenue || 0)}
              </div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-icon revenue">
              <i className="uil uil-money-bill"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="card-header">
        <div
          className="card-title"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>⚡ Quick Actions</span>
          <span className="badge-new" aria-label="New">
            New
          </span>
        </div>
      </div>
      <div className="shortcut-grid">
        <Link
          href="/dashboard/projects"
          className="shortcut-card highlight"
          aria-label="Go to All Projects"
        >
          <span className="shortcut-icon icon-projects">
            <i className="uil uil-folder-open"></i>
          </span>
          <div className="shortcut-content">
            <div className="shortcut-title">All Projects</div>
            <div className="shortcut-desc">Browse, and manage all projects</div>
          </div>
          <i className="uil uil-angle-right-b shortcut-arrow"></i>
        </Link>

        <Link
          href="/dashboard/projects/calendar"
          className="shortcut-card"
          aria-label="Go to Calendar View"
        >
          <span className="shortcut-icon icon-calendar">
            <i className="uil uil-schedule"></i>
          </span>
          <div className="shortcut-content">
            <div className="shortcut-title">Calendar View</div>
            <div className="shortcut-desc">
              See upcoming deadlines in a calendar
            </div>
          </div>
          <i className="uil uil-angle-right-b shortcut-arrow"></i>
        </Link>

        <Link
          href="/dashboard/invoices/add"
          className="shortcut-card highlight"
          aria-label="Create new invoice"
        >
          <span className="shortcut-icon title-icon--trophy">
            <i className="uil uil-invoice"></i>
          </span>
          <div className="shortcut-content">
            <div className="shortcut-title">Create Invoice</div>
            <div className="shortcut-desc">
              Build and send invoices from Freyn
            </div>
          </div>
          <i className="uil uil-angle-right-b shortcut-arrow"></i>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Status Distribution */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--pie">
                  <i className="uil uil-chart-pie"></i>
                </span>
                Project Status Distribution
              </h3>
              <p className="card-subtitle">
                Distribusi jumlah proyek berdasarkan status saat ini.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getStatusChartData() && <PieChart data={getStatusChartData()} />}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--trophy">
                  <i className="uil uil-trophy"></i>
                </span>
                Top Clients
              </h3>
              <p className="card-subtitle">
                Klien dengan jumlah proyek terbanyak.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getTopClientsChartData() && (
                <BarChart
                  data={getTopClientsChartData()}
                  options={{
                    indexAxis: "y",
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Top Clients by Revenue */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--wallet">
                  <i className="uil uil-chart-growth"></i>
                </span>
                Top Clients by Revenue
              </h3>
              <p className="card-subtitle">
                Lima klien dengan pendapatan terbesar.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getTopClientsRevenueChartData() && (
                <BarChart
                  data={getTopClientsRevenueChartData()}
                  options={{
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) =>
                            "Rp " + Number(value).toLocaleString("id-ID"),
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Revenue Split */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--money">
                  <i className="uil uil-money-withdraw"></i>
                </span>
                Revenue Breakdown
              </h3>
              <p className="card-subtitle">
                Perbandingan pendapatan proyek selesai dan masih berjalan.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getRevenueSplitChartData() && (
                <DoughnutChart
                  data={getRevenueSplitChartData()}
                  options={{
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "circle",
                          padding: 15,
                          font: {
                            size: 12,
                            family: "'Poppins', sans-serif",
                          },
                          generateLabels: (chart) => {
                            const data = chart?.data;
                            const datasets = data?.datasets;
                            if (!data?.labels?.length || !datasets?.length) {
                              return [];
                            }

                            const dataset = datasets[0];
                            const meta = chart.getDatasetMeta(0);
                            return data.labels.map((label, index) => {
                              const value = dataset.data?.[index] || 0;
                              const style = meta.controller.getStyle(index);
                              const backgroundColor = Array.isArray(
                                dataset.backgroundColor
                              )
                                ? dataset.backgroundColor[index]
                                : dataset.backgroundColor;
                              const borderColor = Array.isArray(
                                dataset.borderColor
                              )
                                ? dataset.borderColor[index]
                                : style.borderColor;

                              return {
                                text: `${label} ${formatCurrency(value)}`,
                                fillStyle: backgroundColor,
                                strokeStyle: borderColor,
                                lineWidth: style.borderWidth,
                                hidden: !chart.getDataVisibility(index),
                                index,
                              };
                            });
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const value = context.raw || 0;
                            return (
                              context.label +
                              ": " +
                              value.toLocaleString("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              })
                            );
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Projects Over Time */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--line">
                  <i className="uil uil-chart-line"></i>
                </span>
                Revenue Trend (Last 6 Months)
              </h3>
              <p className="card-subtitle">
                Tren pendapatan per bulan dalam 6 bulan terakhir.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getRevenueChartData() && (
                <LineChart
                  data={getRevenueChartData()}
                  options={{
                    scales: {
                      y: {
                        ticks: {
                          callback: function (value) {
                            return "Rp " + value.toLocaleString("id-ID");
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div className="card-header-title">
              <h3 className="card-title">
                <span className="title-icon title-icon--schedule">
                  <i className="uil uil-schedule"></i>
                </span>
                Projects Timeline (Last 6 Months)
              </h3>
              <p className="card-subtitle">
                Jumlah proyek per bulan dalam 6 bulan terakhir.
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: "24px" }}>
            <div style={{ height: "200px" }}>
              {getProjectsChartData() && (
                <BarChart data={getProjectsChartData()} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">Recent Projects</h3>
          <Link href="/dashboard/projects" className="btn btn-sm btn-primary">
            View All
            <i className="uil uil-angle-right-b"></i>
          </Link>
        </div>
        <div className="card-body">
          {dashboardData?.recentProjects?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Project Name</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Revenue</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentProjects.map((project) => {
                    const statusInfo = formatStatus(project.status);
                    return (
                      <tr key={project.id}>
                        <td>
                          <a
                            href="#"
                            className="link"
                            onClick={(e) => {
                              e.preventDefault();
                              handleProjectClick(project);
                            }}
                          >
                            <strong>{project.numberOrder}</strong>
                          </a>
                        </td>
                        <td>{project.projectName}</td>
                        <td>{project.clientName}</td>
                        <td>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="currency">
                          {formatCurrency(project.totalPrice)}
                        </td>
                        <td>
                          {new Date(project.deadline).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <i className="uil uil-file-slash"></i>
              <h3>No Recent Projects</h3>
              <p>Start by creating your first project</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        editProject={selectedProject}
      />
    </div>
  );
}
