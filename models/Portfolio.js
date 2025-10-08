const mongoose = require("mongoose");

const portfolioLinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const portfolioSocialSchema = new mongoose.Schema(
  {
    email: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    x: { type: String, default: "", trim: true },
    threads: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    links: {
      type: [portfolioLinkSchema],
      default: [],
    },
    socials: {
      type: portfolioSocialSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export default
  mongoose.models.Portfolio ||
  mongoose.model("Portfolio", portfolioSchema);
