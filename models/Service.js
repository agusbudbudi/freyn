const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
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

export default mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);
