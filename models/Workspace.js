const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      default: "free",
    },
    settings: {
      locale: {
        type: String,
        default: "id-ID",
      },
      currency: {
        type: String,
        default: "IDR",
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.index({ owner: 1, _id: 1 });

export default
  mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
