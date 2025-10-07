import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(slug = "") {
  return slug.trim().toLowerCase();
}

function toPortfolioResponse(portfolio, workspace, owner) {
  if (!portfolio) {
    return null;
  }

  return {
    id: portfolio._id.toString(),
    workspaceId: portfolio.workspaceId.toString(),
    title: portfolio.title,
    description: portfolio.description || "",
    coverImage: portfolio.coverImage || "",
    slug: portfolio.slug,
    links: (portfolio.links || []).map((link) => ({
      name: link.name,
      url: link.url,
      icon: link.icon || "",
    })),
    workspaceName: workspace?.name || "",
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

    const [portfolio, workspace] = await Promise.all([
      Portfolio.findOne({ workspaceId: authUser.workspaceId }),
      Workspace.findById(authUser.workspaceId),
    ]);

    let owner = null;
    if (workspace?.owner) {
      owner = await User.findById(workspace.owner);
    }

    return successResponse(
      {
        portfolio: toPortfolioResponse(portfolio, workspace, owner),
      },
      "Portfolio fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return errorResponse("Failed to fetch portfolio", 500);
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const title = body?.title?.trim();
    const description = body?.description || "";
    const coverImage = body?.coverImage || "";
    const slug = normalizeSlug(body?.slug || "");
    const links = Array.isArray(body?.links) ? body.links : [];

    if (!title) {
      return errorResponse("Portfolio title is required", 400);
    }

    if (title.length > 140) {
      return errorResponse(
        "Portfolio title must be 140 characters or less",
        400
      );
    }

    if (!slug) {
      return errorResponse("Portfolio slug is required", 400);
    }

    if (!slugRegex.test(slug)) {
      return errorResponse(
        "Slug can only contain lowercase letters, numbers, and hyphens",
        400
      );
    }

    const existingSlug = await Portfolio.findOne({
      slug,
      workspaceId: { $ne: authUser.workspaceId },
    });

    if (existingSlug) {
      return errorResponse("Slug is already in use", 400);
    }

    const sanitizedLinks = links
      .filter((link) => link && (link.name || link.url))
      .map((link) => {
        const name = (link.name || "").trim();
        const url = (link.url || "").trim();
        const icon = link.icon || "";

        if (!name || !url) {
          throw new Error("Each link must include a name and URL");
        }

        if (name.length > 120) {
          throw new Error("Link name must be 120 characters or less");
        }

        const urlPattern = /^(https?:\/\/)([\w.-]+)(:[0-9]+)?(\/.*)?$/i;
        if (!urlPattern.test(url)) {
          throw new Error("Each link URL must be a valid URL");
        }

        return {
          name,
          url,
          icon,
        };
      });

    let portfolio = await Portfolio.findOne({
      workspaceId: authUser.workspaceId,
    });

    if (!portfolio) {
      portfolio = await Portfolio.create({
        workspaceId: authUser.workspaceId,
        title,
        description,
        coverImage,
        slug,
        links: sanitizedLinks,
      });
    } else {
      portfolio.title = title;
      portfolio.description = description;
      portfolio.coverImage = coverImage;
      portfolio.slug = slug;
      portfolio.links = sanitizedLinks;
      await portfolio.save();
    }

    const [workspace, owner] = await Promise.all([
      Workspace.findById(authUser.workspaceId),
      User.findById(authUser.userId),
    ]);

    return successResponse(
      {
        portfolio: toPortfolioResponse(portfolio, workspace, owner),
      },
      "Portfolio saved successfully"
    );
  } catch (error) {
    console.error("Error saving portfolio:", error);

    if (error.message?.includes("Each link")) {
      return errorResponse(error.message, 400);
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return errorResponse("Slug is already in use", 400);
    }

    return errorResponse("Failed to save portfolio", 500);
  }
}
