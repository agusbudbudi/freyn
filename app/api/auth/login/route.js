import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
  generateToken,
  isValidEmail,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse("Please enter a valid email address", 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    const now = new Date();

    const userWorkspaces = Array.isArray(user.workspaces)
      ? user.workspaces
      : [];
    let workspaceEntryAdded = false;

    const ownerWorkspaceEntry = userWorkspaces.find(
      (entry) => entry.role === "owner" && entry.workspace
    );

    let workspace = null;

    if (ownerWorkspaceEntry) {
      workspace = await Workspace.findById(ownerWorkspaceEntry.workspace);
    }

    if (!workspace && user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    if (!workspace) {
      workspace = await Workspace.findOne({ owner: user._id });
    }

    if (!workspace) {
      workspace = await Workspace.create({
        name: `${user.fullName}'s Workspace`,
        owner: user._id,
        slug: `workspace-${user.userId.toLowerCase()}`,
        members: [
          {
            user: user._id,
            role: "owner",
            joinedAt: now,
          },
        ],
      });
      userWorkspaces.push({
        workspace: workspace._id,
        role: "owner",
        joinedAt: now,
      });
      workspaceEntryAdded = true;
    }

    if (!Array.isArray(workspace.members)) {
      workspace.members = [];
    }

    const membershipExists = workspace.members.some(
      (member) => member?.user?.toString() === user._id.toString()
    );

    const isOwner = workspace.owner?.toString() === user._id.toString();

    const existingWorkspaceEntry = userWorkspaces.find(
      (entry) => entry.workspace?.toString() === workspace._id.toString()
    );

    const membershipRole = existingWorkspaceEntry?.role || (isOwner ? "owner" : "member");

    if (!membershipExists) {
      workspace.members.push({
        user: user._id,
        role: membershipRole,
        joinedAt: now,
      });
      await workspace.save();
    } else {
      const memberIndex = workspace.members.findIndex(
        (member) => member?.user?.toString() === user._id.toString()
      );
      if (memberIndex !== -1 && workspace.members[memberIndex].role !== membershipRole) {
        workspace.members[memberIndex].role = membershipRole;
        await workspace.save();
      }
    }

    let savedUser = user;
    let requiresSave = workspaceEntryAdded;

    const hasOwnerWorkspace = userWorkspaces.some(
      (entry) => entry.role === "owner"
    );

    if (isOwner) {
      if (
        !user.workspaceId ||
        user.workspaceId.toString() !== workspace._id.toString()
      ) {
        user.workspaceId = workspace._id;
        user.workspaceJoinedAt = now;
        requiresSave = true;
      } else if (!user.workspaceJoinedAt) {
        user.workspaceJoinedAt = now;
        requiresSave = true;
      }
    } else {
      if (!user.workspaceJoinedAt) {
        user.workspaceJoinedAt = now;
        requiresSave = true;
      }
      if (!hasOwnerWorkspace && !user.workspaceId) {
        user.workspaceId = workspace._id;
        requiresSave = true;
      }
    }

    if (isOwner && user.workspaceRole !== "owner") {
      user.workspaceRole = "owner";
      requiresSave = true;
    } else if (!isOwner) {
      const shouldUpdateRole =
        user.workspaceId?.toString() === workspace._id.toString();
      if (shouldUpdateRole && user.workspaceRole !== membershipRole) {
        user.workspaceRole = membershipRole;
        requiresSave = true;
      }
    }

    user.workspaces = userWorkspaces;

    const hasWorkspaceEntry = userWorkspaces.some(
      (entry) => entry.workspace?.toString() === workspace._id.toString()
    );
    if (!hasWorkspaceEntry) {
      userWorkspaces.push({
        workspace: workspace._id,
        role: membershipRole,
        joinedAt: user.workspaceJoinedAt || now,
      });
      requiresSave = true;
    }

    if (requiresSave) {
      savedUser = await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
    });

    return successResponse(
      {
        user: {
          userId: savedUser.userId,
          fullName: savedUser.fullName,
          email: savedUser.email,
          phone: savedUser.phone || "",
          createdAt: savedUser.createdAt,
          workspaceId: workspace._id.toString(),
          workspaceRole: savedUser.workspaceRole,
          workspaceJoinedAt: savedUser.workspaceJoinedAt,
          workspaces: (savedUser.workspaces || []).map((entry) => ({
            workspaceId: entry.workspace?.toString() || null,
            role: entry.role,
            joinedAt: entry.joinedAt,
          })),
        },
        workspace: {
          id: workspace._id.toString(),
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
        },
        token,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
