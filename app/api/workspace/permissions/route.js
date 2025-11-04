import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

const ROLE_LABELS = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
};

const EDITABLE_ROLES = new Set(["manager", "member"]);

function extractPermissions(workspace) {
  if (!workspace) {
    return Workspace.normalizePermissions();
  }

  const rawPermissions = workspace.permissions
    ? typeof workspace.permissions.toObject === "function"
      ? workspace.permissions.toObject()
      : workspace.permissions
    : {};

  return Workspace.normalizePermissions(rawPermissions);
}

function buildResponsePayload(workspace) {
  const permissions = extractPermissions(workspace);

  const menuConfig = Workspace.getMenuConfig ? Workspace.getMenuConfig() : [];

  const roles = ["owner", "manager", "member"].map((roleKey) => ({
    key: roleKey,
    name: ROLE_LABELS[roleKey] || roleKey,
    permissions: permissions[roleKey] || [],
    editable: EDITABLE_ROLES.has(roleKey),
  }));

  return {
    roles,
    menus: menuConfig,
    permissions,
  };
}

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId || !authUser?.userId) {
      return errorResponse("Unauthorized", 401);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (workspace.owner?.toString() !== authUser.userId) {
      return errorResponse(
        "Only workspace owners can view and update permissions",
        403
      );
    }

    const payload = buildResponsePayload(workspace);

    return successResponse(payload, "Workspace permissions fetched");
  } catch (error) {
    console.error("Error fetching workspace permissions:", error);
    return errorResponse("Failed to fetch workspace permissions", 500);
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
    const role = body?.role;
    const permissionsInput = body?.permissions;

    if (!role || typeof role !== "string") {
      return errorResponse("Role is required", 400);
    }

    if (!EDITABLE_ROLES.has(role)) {
      return errorResponse("Selected role cannot be modified", 400);
    }

    if (!Array.isArray(permissionsInput)) {
      return errorResponse("Permissions must be an array", 400);
    }

    const workspace = await Workspace.findById(authUser.workspaceId);
    if (!workspace) {
      return errorResponse("Workspace not found", 404);
    }

    if (workspace.owner?.toString() !== authUser.userId) {
      return errorResponse(
        "Only workspace owners can update permissions",
        403
      );
    }

    const validMenuKeys = new Set(Workspace.getMenuKeys());
    const sanitizedPermissions = [];
    permissionsInput.forEach((item) => {
      if (typeof item === "string" && validMenuKeys.has(item)) {
        if (!sanitizedPermissions.includes(item)) {
          sanitizedPermissions.push(item);
        }
      }
    });

    const currentPermissions = extractPermissions(workspace);

    workspace.permissions = Workspace.normalizePermissions({
      ...currentPermissions,
      [role]: sanitizedPermissions,
    });
    workspace.markModified("permissions");
    await workspace.save();

    const payload = buildResponsePayload(workspace);

    return successResponse(
      {
        role: role,
        permissions: payload.permissions,
        roles: payload.roles,
      },
      "Workspace permissions updated"
    );
  } catch (error) {
    console.error("Error updating workspace permissions:", error);
    return errorResponse("Failed to update workspace permissions", 500);
  }
}
