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
const MAX_COVER_BYTES = 900 * 1024; // ~900KB after optimization
const MAX_ICON_BYTES = 220 * 1024; // ~220KB per icon

function normalizeSlug(slug = "") {
  return slug.trim().toLowerCase();
}

function toPortfolioResponse(portfolio, workspace, owner) {
  if (!portfolio) {
    return null;
  }

  const socials = portfolio.socials || {};

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
    socials: {
      email: socials.email || "",
      whatsapp: socials.whatsapp || "",
      youtube: socials.youtube || "",
      instagram: socials.instagram || "",
      tiktok: socials.tiktok || "",
      linkedin: socials.linkedin || "",
      facebook: socials.facebook || "",
      x: socials.x || "",
      threads: socials.threads || "",
    },
    workspaceName: workspace?.name || "",
    ownerName: owner?.fullName || "",
  };
}

function sanitizeSocials(rawSocials) {
  if (!rawSocials || typeof rawSocials !== "object") {
    return {};
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9()\s-]{5,}$/;
  const urlKeys = [
    "youtube",
    "instagram",
    "tiktok",
    "linkedin",
    "facebook",
    "x",
    "threads",
  ];

  const sanitized = {};

  if (rawSocials.email && rawSocials.email.trim()) {
    const email = rawSocials.email.trim();
    if (!emailPattern.test(email)) {
      throw new Error("Please enter a valid email address");
    }
    sanitized.email = email.toLowerCase();
  }

  if (rawSocials.whatsapp && rawSocials.whatsapp.trim()) {
    const whatsapp = rawSocials.whatsapp.trim();
    if (phonePattern.test(whatsapp)) {
      sanitized.whatsapp = whatsapp;
    } else {
      try {
        const parsed = new URL(whatsapp);
        if (!parsed.protocol.startsWith("http")) {
          throw new Error("Invalid WhatsApp URL");
        }
        sanitized.whatsapp = whatsapp;
      } catch (error) {
        throw new Error("Please enter a valid WhatsApp number or URL");
      }
    }
  }

  for (const key of urlKeys) {
    const value = rawSocials[key];
    if (!value || !value.trim()) continue;
    const trimmed = value.trim();
    try {
      const parsed = new URL(trimmed);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch (error) {
      throw new Error("Please enter valid URLs for your social media profiles");
    }
    sanitized[key] = trimmed;
  }

  return sanitized;
}

export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const [portfolio, workspace] = await Promise.all([
      Portfolio.findOne({ workspaceId: authUser.workspaceId }).lean(),
      Workspace.findById(authUser.workspaceId).select("name owner").lean(),
    ]);

    const owner = workspace?.owner
      ? await User.findById(workspace.owner).select("fullName").lean()
      : null;

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
    const socials = body?.socials && typeof body.socials === "object"
      ? body.socials
      : {};

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

    if (coverImage && estimateDataUrlBytes(coverImage) > MAX_COVER_BYTES) {
      return errorResponse("Cover image is too large", 400);
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

        if (icon && estimateDataUrlBytes(icon) > MAX_ICON_BYTES) {
          throw new Error("Each link icon must be smaller than 220KB");
        }

        return {
          name,
          url,
          icon,
        };
      });

    const sanitizedSocials = sanitizeSocials(socials);

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
        socials: sanitizedSocials,
      });
    } else {
      portfolio.title = title;
      portfolio.description = description;
      portfolio.coverImage = coverImage;
      portfolio.slug = slug;
      portfolio.links = sanitizedLinks;
      portfolio.socials = sanitizedSocials;
      await portfolio.save();
    }

    const [workspace, owner] = await Promise.all([
      Workspace.findById(authUser.workspaceId)
        .select("name owner")
        .lean(),
      User.findById(authUser.userId).select("fullName").lean(),
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

    if (error.message?.startsWith("Please enter")) {
      return errorResponse(error.message, 400);
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return errorResponse("Slug is already in use", 400);
    }

    return errorResponse("Failed to save portfolio", 500);
  }
}

function estimateDataUrlBytes(dataUrl = "") {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}
