const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
    index: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  servicePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  durationOfWork: {
    type: Number,
    required: true,
    min: 1,
  },
  deliverables: {
    type: String,
    default: "",
  },
  unlimitedRevision: {
    type: Boolean,
    default: false,
  },
  totalRevision: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Generate unique service ID with prefix 'S' + 5 random digits
 * Ensures uniqueness by checking the database, retries up to 10 times.
 */
async function generateUniqueServiceId(ServiceModel) {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
    const candidate = `S${random}`;
    const exists = await ServiceModel.exists({ id: candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new Error(
    "Unable to generate unique service ID after multiple attempts"
  );
}

/**
 * Ensure service id exists before validation so required validator passes
 * and format stays 'S' + 5 digits.
 */
serviceSchema.pre("validate", async function (next) {
  if (!this.id) {
    try {
      this.id = await generateUniqueServiceId(this.constructor);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Update timestamps on save
serviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update timestamps on update
serviceSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

/**
 * In dev/hot-reload, ensure schema changes (hooks, indexes) are applied
 * by removing previously compiled model before redefining it.
 */
if (mongoose.models.Service) {
  delete mongoose.models.Service;
}
export default mongoose.model("Service", serviceSchema);
