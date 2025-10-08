import { cache } from "react";
import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import Workspace from "@/models/Workspace";
import User from "@/models/User";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(slug = "") {
  return slug.toString().trim().toLowerCase();
}

function toPublicPortfolio(portfolio, workspace, owner) {
  if (!portfolio) {
    return null;
  }

  const links = Array.isArray(portfolio.links) ? portfolio.links : [];
  const socials = portfolio.socials || {};

  return {
    id: portfolio._id.toString(),
    slug: portfolio.slug,
    title: portfolio.title,
    description: portfolio.description || "",
    coverImage: portfolio.coverImage || "",
    links: links.map((link) => ({
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
    owner: owner
      ? {
          fullName: owner.fullName || "",
          bio: owner.bio || "",
          profileImage: owner.profileImage || "",
        }
      : {
          fullName: workspace?.name || "",
          bio: "",
          profileImage: "",
        },
  };
}

export const getPublicPortfolioBySlug = cache(async (rawSlug) => {
  const slug = normalizeSlug(rawSlug);

  if (!slug || !slugRegex.test(slug)) {
    return null;
  }

  await dbConnect();

  const portfolio = await Portfolio.findOne({ slug });

  if (!portfolio) {
    return null;
  }

  const workspace = portfolio.workspaceId
    ? await Workspace.findById(portfolio.workspaceId)
    : null;

  let owner = null;

  if (workspace?.owner) {
    owner = await User.findById(workspace.owner);
  }

  return toPublicPortfolio(portfolio, workspace, owner);
});
