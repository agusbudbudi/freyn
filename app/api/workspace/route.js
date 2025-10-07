import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

function serializeWorkspace(workspace, owner) {
  if (!workspace) {
    return null;
  }

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    status: workspace.status,
    ownerId: workspace.owner?.toString() || null,
    ownerName: owner?.fullName || "",
  };
}

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    const owner = workspace.owner
      ? await User.findById(workspace.owner)
      : null;

    return successResponse(
      {
        workspace: serializeWorkspace(workspace, owner),
      },
      "Workspace fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return errorResponse("Failed to fetch workspace", 500);
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return errorResponse("Workspace name is required", 400);
    }

    if (name.length > 120) {
      return errorResponse(
        "Workspace name must be 120 characters or less",
        400
      );
    }

    const workspace = await Workspace.findOneAndUpdate(
      { _id: authUser.workspaceId, owner: authUser.userId },
      { $set: { name } },
      { new: true }
    );

    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    const owner = workspace.owner
      ? await User.findById(workspace.owner)
      : null;

    return successResponse(
      {
        workspace: serializeWorkspace(workspace, owner),
      },
      "Workspace updated successfully"
    );
  } catch (error) {
    console.error("Error updating workspace:", error);
    return errorResponse("Failed to update workspace", 500);
  }
}
