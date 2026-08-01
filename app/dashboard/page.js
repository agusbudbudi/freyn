"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import PieChart from "@/components/charts/PieChart";
import DoughnutChart from "@/components/charts/DoughnutChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import { useWorkspaceSwitchListener } from "@/lib/hooks/useWorkspaceSwitchListener";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import TitleIcon from "@/components/ui/TitleIcon";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";
import ShortcutCard from "@/components/ui/ShortcutCard";
import { buttonClasses } from "@/components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useWorkspaceSwitchListener(fetchDashboardData);

  const handleProjectClick = (project) => {
    router.push(`/dashboard/projects/${project.id}/edit`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    const value = Number(amount) || 0;
    const abs = Math.abs(value);

    const round = (num) => {
      const rounded = Math.round((num + Number.EPSILON) * 10) / 10;
      return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    };

    if (abs >= 1_000_000_000) return `Rp ${round(value / 1_000_000_000)}M`;
    if (abs >= 1_000_000) return `Rp ${round(value / 1_000_000)}jt`;
    if (abs >= 100_000) return `Rp ${round(value / 1_000)}rb`;
    return formatCurrency(value);
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
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Alert type="error">
          <i className="uil uil-exclamation-triangle"></i> {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-3">
        <StatCard
          variant="total"
          icon={<i className="uil uil-folder-open"></i>}
          number={dashboardData?.stats?.total || 0}
          label="Total Projects"
        />
        <StatCard
          variant="ongoing"
          icon={<i className="uil uil-clock-three"></i>}
          number={dashboardData?.stats?.ongoing || 0}
          label="Ongoing Projects"
        />
        <StatCard
          variant="completed"
          icon={<i className="uil uil-check-circle"></i>}
          number={dashboardData?.stats?.completed || 0}
          label="Completed Projects"
        />
        <StatCard
          variant="revenue"
          icon={<i className="uil uil-money-bill"></i>}
          number={formatCompactCurrency(dashboardData?.stats?.totalRevenue || 0)}
          label="Total Revenue"
        />
      </div>

      {/* Shortcuts */}
      <div className="p-4 flex justify-between items-center gap-3">
        <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <span>⚡ Quick Actions</span>
        </div>
      </div>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-3 my-2.5 mb-6">
        <ShortcutCard
          href="/dashboard/projects"
          ariaLabel="Go to All Projects"
          iconVariant="projects"
          icon={<i className="uil uil-folder-open"></i>}
          title="All Projects"
          description="Browse, and manage all projects"
        />
        <ShortcutCard
          href="/dashboard/projects/calendar"
          ariaLabel="Go to Calendar View"
          iconVariant="calendar"
          icon={<i className="uil uil-schedule"></i>}
          title="Calendar View"
          description="See upcoming deadlines in a calendar"
        />
        <ShortcutCard
          href="/dashboard/invoices/add"
          ariaLabel="Create new invoice"
          iconVariant="invoice"
          icon={<i className="uil uil-invoice"></i>}
          title="Create Invoice"
          description="Build and send invoices from Freyn"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(400px,1fr))] gap-6 mb-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="pie"><i className="uil uil-chart-pie"></i></TitleIcon>}>
                Project Status Distribution
              </CardTitle>
              <CardSubtitle>
                Distribusi jumlah proyek berdasarkan status saat ini.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div style={{ height: "200px" }}>
              {getStatusChartData() && <PieChart data={getStatusChartData()} />}
            </div>
          </CardBody>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="trophy"><i className="uil uil-trophy"></i></TitleIcon>}>
                Top Clients
              </CardTitle>
              <CardSubtitle>
                Klien dengan jumlah proyek terbanyak.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
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
          </CardBody>
        </Card>

        {/* Top Clients by Revenue */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="wallet"><i className="uil uil-chart-growth"></i></TitleIcon>}>
                Top Clients by Revenue
              </CardTitle>
              <CardSubtitle>
                Lima klien dengan pendapatan terbesar.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
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
          </CardBody>
        </Card>

        {/* Revenue Split */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="money"><i className="uil uil-money-withdraw"></i></TitleIcon>}>
                Revenue Breakdown
              </CardTitle>
              <CardSubtitle>
                Perbandingan pendapatan proyek selesai dan masih berjalan.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
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
          </CardBody>
        </Card>
      </div>

      {/* Revenue & Projects Over Time */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="line"><i className="uil uil-chart-line"></i></TitleIcon>}>
                Revenue Trend (Last 6 Months)
              </CardTitle>
              <CardSubtitle>
                Tren pendapatan per bulan dalam 6 bulan terakhir.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle icon={<TitleIcon variant="schedule"><i className="uil uil-schedule"></i></TitleIcon>}>
                Projects Timeline (Last 6 Months)
              </CardTitle>
              <CardSubtitle>
                Jumlah proyek per bulan dalam 6 bulan terakhir.
              </CardSubtitle>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <div style={{ height: "200px" }}>
              {getProjectsChartData() && (
                <BarChart data={getProjectsChartData()} />
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <Link href="/dashboard/projects" className={buttonClasses({ variant: "primary", size: "sm" })}>
            View All
            <i className="uil uil-angle-right-b"></i>
          </Link>
        </CardHeader>
        <CardBody>
          {dashboardData?.recentProjects?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Order No</th>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Project Name</th>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Client</th>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Status</th>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Revenue</th>
                    <th className="py-3.5 px-5 text-left bg-slate-100 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentProjects.map((project) => {
                    const statusInfo = formatStatus(project.status);
                    return (
                      <tr key={project.id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 [&:last-child_td]:border-b-0">
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <a
                            href="#"
                            className="text-blue-500 no-underline cursor-pointer whitespace-nowrap hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              handleProjectClick(project);
                            }}
                          >
                            <strong>{project.numberOrder}</strong>
                          </a>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{project.projectName}</td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">{project.clientName}</td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
                          <StatusBadge status={statusInfo.class}>
                            {statusInfo.label}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs font-bold text-emerald-600">
                          {formatCurrency(project.totalPrice)}
                        </td>
                        <td className="py-2.5 pr-3 pl-5 border-b border-slate-100 text-xs">
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
            <EmptyState
              icon="uil uil-file-slash"
              title="No Recent Projects"
              description="Start by creating your first project"
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
