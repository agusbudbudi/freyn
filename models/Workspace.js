const mongoose = require("mongoose");
const permissionsConfig = require("../lib/workspacePermissions.json");

const MENU_KEYS = Array.isArray(permissionsConfig?.menuItems)
  ? permissionsConfig.menuItems
      .map((item) => item?.key)
      .filter((key) => typeof key === "string" && key.length > 0)
  : [];

const DEFAULT_PERMISSIONS_CONFIG = permissionsConfig?.defaultPermissions || {};

const sanitizeRolePermissions = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  values.forEach((value) => {
    if (typeof value === "string" && MENU_KEYS.includes(value)) {
      seen.add(value);
    }
  });
  return Array.from(seen.values());
};

const DEFAULT_MANAGER_PERMISSIONS = sanitizeRolePermissions(
  DEFAULT_PERMISSIONS_CONFIG.manager || MENU_KEYS
);

const DEFAULT_MEMBER_PERMISSIONS = sanitizeRolePermissions(
  DEFAULT_PERMISSIONS_CONFIG.member || []
);

const normalizePermissions = (input = {}) => {
  const normalizedManager = sanitizeRolePermissions(
    Object.prototype.hasOwnProperty.call(input, "manager")
      ? input.manager
      : DEFAULT_MANAGER_PERMISSIONS
  );

  const normalizedMember = sanitizeRolePermissions(
    Object.prototype.hasOwnProperty.call(input, "member")
      ? input.member
      : DEFAULT_MEMBER_PERMISSIONS
  );

  return {
    owner: [...MENU_KEYS],
    manager: normalizedManager,
    member: normalizedMember,
  };
};

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
    permissions: {
      owner: {
        type: [String],
        default: () => [...MENU_KEYS],
      },
      manager: {
        type: [String],
        default: () => [...DEFAULT_MANAGER_PERMISSIONS],
      },
      member: {
        type: [String],
        default: () => [...DEFAULT_MEMBER_PERMISSIONS],
      },
    },
    members: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            enum: ["owner", "manager", "member"],
            default: "member",
          },
          joinedAt: {
            type: Date,
            default: Date.now,
          },
          invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      default: [],
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

workspaceSchema.pre("save", function (next) {
  this.permissions = normalizePermissions(this.permissions || {});
  this.markModified("permissions");
  next();
});

workspaceSchema.statics.getMenuKeys = function () {
  return [...MENU_KEYS];
};

workspaceSchema.statics.getMenuConfig = function () {
  return Array.isArray(permissionsConfig?.menuItems)
    ? permissionsConfig.menuItems.map((item) => ({
        key: item.key,
        label: item.label,
      }))
    : [];
};

workspaceSchema.statics.getDefaultPermissions = function () {
  return {
    owner: [...MENU_KEYS],
    manager: [...DEFAULT_MANAGER_PERMISSIONS],
    member: [...DEFAULT_MEMBER_PERMISSIONS],
  };
};

workspaceSchema.statics.normalizePermissions = function (input) {
  return normalizePermissions(input);
};

export default
  mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
