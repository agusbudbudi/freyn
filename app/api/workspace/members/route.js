import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  isValidEmail,
} from "@/lib/auth";

const ALLOWED_ROLES = ["member", "manager", "owner"];

const resolveMemberUserId = (memberUser) => {
  if (!memberUser) return null;
  if (typeof memberUser === "string") return memberUser;
  if (typeof memberUser === "object" && memberUser._id) {
    return memberUser._id.toString();
  }
  if (
    typeof memberUser === "object" &&
    typeof memberUser.toString === "function"
  ) {
    return memberUser.toString();
  }
  return null;
};

function normalizeRole(role) {
  const value = (role || "").toLowerCase();
  if (ALLOWED_ROLES.includes(value) && value !== "owner") {
    return value;
  }
  return "member";
}

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const workspace = await Workspace.findById(authUser.workspaceId).lean();

    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    const workspaceIdString = workspace._id.toString();

    const usersInWorkspace = await User.find({
      "workspaces.workspace": workspace._id,
    })
      .select(
        "fullName email workspaces workspaceId workspaceRole workspaceJoinedAt"
      )
      .lean();

    const membersMap = new Map();

    usersInWorkspace.forEach((user) => {
      const userId = user._id.toString();
      const workspaceEntry = Array.isArray(user.workspaces)
        ? user.workspaces.find(
            (entry) => entry.workspace?.toString() === workspaceIdString
          )
        : null;

      if (!workspaceEntry) {
        return;
      }

      membersMap.set(userId, {
        id: userId,
        fullName: user.fullName || "Unnamed Member",
        email: user.email || "",
        role: workspaceEntry.role || "member",
        joinedAt: workspaceEntry.joinedAt || null,
      });
    });

    const membersArray = Array.isArray(workspace.members)
      ? workspace.members
      : [];

    membersArray.forEach((member) => {
      const memberId = member?.user?.toString?.();
      if (!memberId) {
        return;
      }

      const existing = membersMap.get(memberId);

      membersMap.set(memberId, {
        id: memberId,
        fullName: existing?.fullName || "Unnamed Member",
        email: existing?.email || "",
        role: member?.role || existing?.role || "member",
        joinedAt: member?.joinedAt || existing?.joinedAt || null,
      });
    });

    const ownerId = workspace.owner?.toString();

    if (ownerId) {
      const ownerDetails = membersMap.get(ownerId) || {};
      membersMap.set(ownerId, {
        id: ownerId,
        fullName: ownerDetails.fullName || "Owner",
        email: ownerDetails.email || "",
        role: "owner",
        joinedAt: ownerDetails.joinedAt || workspace.createdAt || null,
      });
    }

    const membersList = Array.from(membersMap.values());

    const isOwner = workspace.owner?.toString() === authUser.userId;
    const isMember = membersList.some((member) => member.id === authUser.userId);

    if (!isOwner && !isMember) {
      return errorResponse("Forbidden", 403);
    }

    membersList.sort((a, b) => {
      const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return timeA - timeB;
    });

    return successResponse(
      { members: membersList },
      "Workspace members fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return errorResponse("Failed to fetch workspace members", 500);
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    const role = normalizeRole(body?.role);

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse("Please enter a valid email", 400);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (workspace.owner?.toString() !== authUser.userId) {
      return errorResponse("Only workspace owners can add members", 403);
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return errorResponse("User email is not registered on Freyn", 404);
    }

    if (!Array.isArray(workspace.members)) {
      workspace.members = [];
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user?.toString() === invitedUser._id.toString()
    );

    if (alreadyMember) {
      return errorResponse("User is already a member of this workspace", 409);
    }

    const now = new Date();
    const inviterObjectId = mongoose.Types.ObjectId.isValid(authUser.userId)
      ? new mongoose.Types.ObjectId(authUser.userId)
      : undefined;
    workspace.members.push({
      user: invitedUser._id,
      role,
      joinedAt: now,
      invitedBy: inviterObjectId,
    });
    await workspace.save();

    if (!Array.isArray(invitedUser.workspaces)) {
      invitedUser.workspaces = [];
    }

    const userHasWorkspace = invitedUser.workspaces.some(
      (entry) => entry.workspace?.toString() === workspace._id.toString()
    );

    if (!userHasWorkspace) {
      invitedUser.workspaces.push({
        workspace: workspace._id,
        role,
        joinedAt: now,
      });
    }

    if (!invitedUser.workspaceId) {
      invitedUser.workspaceId = workspace._id;
      invitedUser.workspaceRole = role;
      invitedUser.workspaceJoinedAt = now;
    }

    await invitedUser.save();

    return successResponse(
      {
        member: {
          id: invitedUser._id.toString(),
          fullName: invitedUser.fullName,
          email: invitedUser.email,
          role,
          joinedAt: now,
        },
      },
      "Member added successfully",
      201
    );
  } catch (error) {
    console.error("Error adding workspace member:", error);
    return errorResponse("Failed to add member", 500);
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const memberId = body?.memberId?.toString();
    const role = normalizeRole(body?.role);

    if (!memberId) {
      return errorResponse("Member ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse("Invalid member ID", 400);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (workspace.owner?.toString() !== authUser.userId) {
      return errorResponse("Only workspace owners can update members", 403);
    }

    if (!Array.isArray(workspace.members)) {
      workspace.members = [];
    }

    const memberIndex = workspace.members.findIndex(
      (member) => member?.user?.toString() === memberId
    );

    if (memberIndex === -1) {
      return errorResponse("Member not found", 404);
    }

    const targetMember = workspace.members[memberIndex];

    if (targetMember.user?.toString() === workspace.owner?.toString()) {
      return errorResponse("Cannot change the workspace owner role", 400);
    }

    workspace.members[memberIndex].role = role;
    await workspace.save();

    const memberUser = await User.findById(memberId);
    if (memberUser) {
      if (!Array.isArray(memberUser.workspaces)) {
        memberUser.workspaces = [];
      }

      const workspaceEntryIndex = memberUser.workspaces.findIndex(
        (entry) => entry.workspace?.toString() === workspace._id.toString()
      );

      if (workspaceEntryIndex !== -1) {
        memberUser.workspaces[workspaceEntryIndex].role = role;
      } else {
        memberUser.workspaces.push({
          workspace: workspace._id,
          role,
          joinedAt: targetMember.joinedAt || new Date(),
        });
      }

      if (memberUser.workspaceId?.toString() === workspace._id.toString()) {
        memberUser.workspaceRole = role;
      }

      await memberUser.save();
    }

    const populatedMember = await Workspace.findById(authUser.workspaceId)
      .populate({
        path: "members.user",
        select: "fullName email",
      })
      .lean();

    const updatedMember = populatedMember?.members?.find(
      (member) => resolveMemberUserId(member.user) === memberId
    );

    return successResponse(
      {
        member: updatedMember
          ? {
              id: resolveMemberUserId(updatedMember.user),
              fullName: updatedMember.user?.fullName || "Unnamed Member",
              email: updatedMember.user?.email || "",
              role: updatedMember.role,
              joinedAt: updatedMember.joinedAt || null,
            }
          : null,
      },
      "Member updated successfully"
    );
  } catch (error) {
    console.error("Error updating workspace member:", error);
    return errorResponse("Failed to update member", 500);
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const memberId = body?.memberId?.toString();

    if (!memberId) {
      return errorResponse("Member ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse("Invalid member ID", 400);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (workspace.owner?.toString() !== authUser.userId) {
      return errorResponse("Only workspace owners can delete members", 403);
    }

    if (!Array.isArray(workspace.members)) {
      workspace.members = [];
    }

    const memberIndex = workspace.members.findIndex(
      (member) => member?.user?.toString() === memberId
    );

    if (memberIndex === -1) {
      return errorResponse("Member not found", 404);
    }

    if (workspace.members[memberIndex].user?.toString() === workspace.owner?.toString()) {
      return errorResponse("Cannot remove the workspace owner", 400);
    }

    workspace.members.splice(memberIndex, 1);
    await workspace.save();

    const memberUser = await User.findById(memberId);
    if (memberUser) {
      if (!Array.isArray(memberUser.workspaces)) {
        memberUser.workspaces = [];
      }

      memberUser.workspaces = memberUser.workspaces.filter(
        (entry) => entry.workspace?.toString() !== workspace._id.toString()
      );

      if (memberUser.workspaceId?.toString() === workspace._id.toString()) {
        const ownerEntry = memberUser.workspaces.find(
          (entry) => entry.role === "owner"
        );
        if (ownerEntry) {
          memberUser.workspaceId = ownerEntry.workspace;
          memberUser.workspaceRole = ownerEntry.role;
          memberUser.workspaceJoinedAt = ownerEntry.joinedAt;
        } else if (memberUser.workspaces.length > 0) {
          const fallback = memberUser.workspaces[0];
          memberUser.workspaceId = fallback.workspace;
          memberUser.workspaceRole = fallback.role;
          memberUser.workspaceJoinedAt = fallback.joinedAt;
        } else {
          memberUser.workspaceId = undefined;
          memberUser.workspaceRole = undefined;
          memberUser.workspaceJoinedAt = undefined;
        }
      }

      await memberUser.save();
    }

    return successResponse(null, "Member removed successfully");
  } catch (error) {
    console.error("Error removing workspace member:", error);
    return errorResponse("Failed to remove member", 500);
  }
}
