import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

// GET /api/projects/stats/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const projects = await Project.find({
      workspaceId: authUser.workspaceId,
    }).sort({ createdAt: -1 });

    // Basic stats
    const stats = {
      total: projects.length,
      ongoing: projects.filter((p) => !["done"].includes(p.status)).length,
      completed: projects.filter((p) => p.status === "done").length,
      ongoingRevenue: projects
        .filter((p) => !["done"].includes(p.status))
        .reduce((sum, p) => sum + (p.totalPrice || 0), 0),
      completedRevenue: projects
        .filter((p) => p.status === "done")
        .reduce((sum, p) => sum + (p.totalPrice || 0), 0),
      totalRevenue: projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0),
    };

    // Status distribution for pie chart
    const statusCounts = projects.reduce((acc, p) => {
      const status = p.status || "to do";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Monthly revenue for line chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = {};
    const monthlyProjects = {};

    projects.forEach((p) => {
      const date = new Date(p.createdAt);
      if (date >= sixMonthsAgo) {
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyRevenue[monthKey] =
          (monthlyRevenue[monthKey] || 0) + (p.totalPrice || 0);
        monthlyProjects[monthKey] = (monthlyProjects[monthKey] || 0) + 1;
      }
    });

    // Generate last 6 months labels
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      months.push({
        label: date.toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        }),
        key: monthKey,
        revenue: monthlyRevenue[monthKey] || 0,
        projects: monthlyProjects[monthKey] || 0,
      });
    }

    // Top clients by project count
    const clientCounts = projects.reduce((acc, p) => {
      const client = p.clientName || "Unknown";
      if (!acc[client]) {
        acc[client] = { count: 0, revenue: 0 };
      }
      acc[client].count += 1;
      acc[client].revenue += p.totalPrice || 0;
      return acc;
    }, {});

    const topClients = Object.entries(clientCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent projects (last 5)
    const recentProjects = projects.slice(0, 5).map((p) => ({
      id: p._id,
      numberOrder: p.numberOrder,
      projectName: p.projectName,
      clientName: p.clientName,
      status: p.status,
      totalPrice: p.totalPrice,
      deadline: p.deadline,
    }));

    return successResponse(
      {
        stats,
        statusDistribution: statusCounts,
        monthlyData: months,
        topClients,
        recentProjects,
      },
      "Dashboard statistics fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return errorResponse("Failed to fetch dashboard statistics", 500);
  }
}
