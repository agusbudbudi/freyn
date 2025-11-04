import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  generateToken,
} from "@/lib/auth";

const formatUserResponse = (user) => ({
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || "",
  workspaceId: user.workspaceId?.toString() || null,
  workspaceRole: user.workspaceRole || null,
  workspaceJoinedAt: user.workspaceJoinedAt || null,
  workspaces: (user.workspaces || []).map((entry) => ({
    workspaceId: entry.workspace?.toString() || null,
    role: entry.role,
    joinedAt: entry.joinedAt,
  })),
});

const formatWorkspaceResponse = (workspace) => {
  if (!workspace) {
    return null;
  }

  const permissions = Workspace.normalizePermissions(
    workspace.permissions?.toObject?.() || workspace.permissions
  );

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    status: workspace.status,
    permissions,
  };
};

export async function POST(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const workspaceId = body?.workspaceId;

    if (!workspaceId) {
      return errorResponse("Workspace ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return errorResponse("Invalid workspace ID", 400);
    }

    const user = await User.findById(authUser.userId);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (!Array.isArray(user.workspaces)) {
      user.workspaces = [];
    }

    const membershipEntry = user.workspaces.find(
      (entry) => entry.workspace?.toString() === workspaceId
    );

    const isOwner = workspace.owner?.toString() === user._id.toString();

    if (!membershipEntry && !isOwner) {
      return errorResponse("You are not a member of this workspace", 403);
    }

    const now = new Date();

    if (!Array.isArray(workspace.members)) {
      workspace.members = [];
    }

    const memberIndex = workspace.members.findIndex(
      (member) => member?.user?.toString() === user._id.toString()
    );

    const membershipRole = membershipEntry?.role || (isOwner ? "owner" : "member");

    if (memberIndex === -1) {
      workspace.members.push({
        user: user._id,
        role: membershipRole,
        joinedAt: membershipEntry?.joinedAt || now,
      });
      await workspace.save();
    }

    user.workspaceId = workspace._id;
    user.workspaceRole = membershipRole;
    user.workspaceJoinedAt = membershipEntry?.joinedAt || now;

    if (!membershipEntry) {
      user.workspaces.push({
        workspace: workspace._id,
        role: membershipRole,
        joinedAt: user.workspaceJoinedAt,
      });
    }

    await user.save();

    const latestUser = await User.findById(user._id).lean();
    const token = generateToken({
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
    });

    const response = successResponse(
      {
        user: formatUserResponse(latestUser),
        workspace: formatWorkspaceResponse(workspace),
        token,
      },
      "Workspace switched successfully"
    );

    response.headers.set(
      "Set-Cookie",
      `token=${token}; Path=/; Max-Age=604800; SameSite=Lax`
    );

    return response;
  } catch (error) {
    console.error("Error switching workspace:", error);
    return errorResponse("Failed to switch workspace", 500);
  }
}
