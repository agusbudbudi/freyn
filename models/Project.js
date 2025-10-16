const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
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
  numberOrder: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined until generated
  },
  projectName: {
    type: String,
    required: true,
  },
  clientId: {
    type: String,
    default: "",
  },
  clientName: {
    type: String,
    required: true,
  },
  clientEmail: {
    type: String,
    default: "",
  },
  clientCompany: {
    type: String,
    default: "",
  },
  clientAddress: {
    type: String,
    default: "",
  },
  clientPhone: {
    type: String,
    default: "",
  },
  deadline: {
    type: Date,
    required: true,
  },
  brief: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  deliverables: {
    type: String,
    default: "",
  },
  invoice: {
    type: String,
    default: "",
  },
  linkedInvoiceId: {
    type: String,
    default: "",
  },
  linkedInvoiceNumber: {
    type: String,
    default: "",
  },
  serviceId: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: [
      "to do",
      "in progress",
      "waiting for payment",
      "in review",
      "revision",
      "done",
    ],
    default: "to do",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  comments: [
    {
      id: {
        type: String,
        required: true,
        default: () => Date.now().toString(),
      },
      content: {
        type: String,
        required: true,
      },
      authorName: {
        type: String,
        required: true,
      },
      authorEmail: {
        type: String,
        required: true,
      },
      authorAvatar: {
        type: String,
        default: "",
      },
      isClient: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Update the updatedAt field before saving
projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
projectSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
