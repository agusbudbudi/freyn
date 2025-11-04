import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await User.findById(authUser.userId).lean();
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const workspaceEntries = Array.isArray(user.workspaces)
      ? user.workspaces
      : [];

    const workspaceIdSet = new Set();

    workspaceEntries.forEach((entry) => {
      if (entry?.workspace) {
        workspaceIdSet.add(entry.workspace.toString());
      }
    });

    if (user.workspaceId) {
      workspaceIdSet.add(user.workspaceId.toString());
    }

    const workspaceIds = Array.from(workspaceIdSet);

    const workspaces = workspaceIds.length
      ? await Workspace.find({ _id: { $in: workspaceIds } })
          .select("name slug owner plan status createdAt")
          .lean()
      : [];

    const workspaceMap = new Map(
      workspaces.map((workspace) => [workspace._id.toString(), workspace])
    );

    const items = [];

    workspaceEntries.forEach((entry) => {
      if (!entry?.workspace) return;
      const workspaceId = entry.workspace.toString();
      const workspace = workspaceMap.get(workspaceId);
      if (!workspace) return;

      items.push({
        id: workspaceId,
        name: workspace.name || "Workspace",
        slug: workspace.slug || "",
        role: entry.role || "member",
        joinedAt: entry.joinedAt || null,
        isOwner: workspace.owner?.toString() === user._id.toString(),
        plan: workspace.plan || "free",
        status: workspace.status || "active",
      });
    });

    if (user.workspaceId) {
      const workspaceId = user.workspaceId.toString();
      if (!items.some((item) => item.id === workspaceId)) {
        const workspace = workspaceMap.get(workspaceId);
        if (workspace) {
          items.push({
            id: workspaceId,
            name: workspace.name || "Workspace",
            slug: workspace.slug || "",
            role:
              workspace.owner?.toString() === user._id.toString()
                ? "owner"
                : user.workspaceRole || "member",
            joinedAt: user.workspaceJoinedAt || workspace.createdAt || null,
            isOwner: workspace.owner?.toString() === user._id.toString(),
            plan: workspace.plan || "free",
            status: workspace.status || "active",
          });
        }
      }
    }

    items.sort((a, b) => {
      if (a.isOwner && !b.isOwner) return -1;
      if (!a.isOwner && b.isOwner) return 1;
      if (a.joinedAt && b.joinedAt) {
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return successResponse({ workspaces: items });
  } catch (error) {
    console.error("Error fetching workspace list:", error);
    return errorResponse("Failed to fetch workspace list", 500);
  }
}
