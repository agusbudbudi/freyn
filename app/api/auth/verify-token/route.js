import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
  getTokenFromRequest,
  verifyToken,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    // Get and verify token
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse("Access token is required", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse("Invalid or expired token", 401);
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    let workspace = await Workspace.findById(user.workspaceId);

    if (!workspace) {
      const ownerWorkspace = await Workspace.findOne({ owner: user._id });
      if (ownerWorkspace) {
        workspace = ownerWorkspace;
      }
    }

    return successResponse(
      {
        user: {
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
        },
        workspace: workspace
          ? {
              id: workspace._id.toString(),
              name: workspace.name,
              slug: workspace.slug,
              plan: workspace.plan,
              status: workspace.status,
            }
          : null,
      },
      "Token is valid"
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return errorResponse("Token verification failed", 500);
  }
}
