import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import { authenticateRequest, errorResponse, successResponse } from "@/lib/auth";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug") || "";
    const slug = rawSlug.trim().toLowerCase();

    if (!slug) {
      return errorResponse("Slug is required", 400);
    }

    if (!slugRegex.test(slug)) {
      return errorResponse(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        400
      );
    }

    const existing = await Portfolio.findOne({
      slug,
      workspaceId: { $ne: authUser.workspaceId },
    });

    return successResponse({ available: !existing });
  } catch (error) {
    console.error("Error checking slug:", error);
    return errorResponse("Failed to validate slug", 500);
  }
}
