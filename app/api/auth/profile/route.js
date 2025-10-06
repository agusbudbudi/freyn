import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
  getTokenFromRequest,
  verifyToken,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function GET(request) {
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

    const workspace = await Workspace.findById(user.workspaceId);

    return successResponse({
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
        bio: user.bio || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        workspaceId: user.workspaceId?.toString() || null,
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
    });
  } catch (error) {
    console.error("Profile error:", error);
    return errorResponse("Failed to get profile", 500);
  }
}

export async function PUT(request) {
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

    // Get update data
    const body = await request.json();
    const { fullName, phone, bio } = body;

    // Disallow changing email via profile update
    if (typeof body.email !== "undefined" && body.email !== user.email) {
      return errorResponse("Email cannot be changed", 400);
    }

    // Build updates object with validations
    const updates = {};

    if (fullName) {
      if (fullName.trim().length < 2) {
        return errorResponse(
          "Full name must be at least 2 characters long",
          400
        );
      }
      updates.fullName = fullName.trim();
    }

    if (typeof phone !== "undefined") {
      if (phone && phone.trim().length < 6) {
        return errorResponse("Phone must be at least 6 characters long", 400);
      }
      updates.phone = phone ? phone.trim() : "";
    }

    if (typeof bio !== "undefined") {
      if (bio && bio.length > 500) {
        return errorResponse("Bio must be at most 500 characters long", 400);
      }
      updates.bio = bio || "";
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true }
    );

    return successResponse(
      {
        user: {
          userId: updatedUser.userId,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone || "",
          bio: updatedUser.bio || "",
          updatedAt: updatedUser.updatedAt,
          workspaceId: updatedUser.workspaceId?.toString() || null,
        },
      },
      "Profile updated successfully"
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return errorResponse("Failed to update profile", 500);
  }
}
