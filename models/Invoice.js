const mongoose = require("mongoose");

const billedPartySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    address: { type: String, default: "" },
    clientId: { type: String, default: "" },
  },
  { _id: false }
);

const invoiceItemSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    deliverables: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bank_transfer", "e_wallet"],
      default: "bank_transfer",
    },
    bank: {
      name: { type: String, default: "" },
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
    },
    ewallet: {
      provider: { type: String, default: "" },
      accountName: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "paid"],
    default: "draft",
    index: true,
  },
  logo: {
    type: String,
    default: "",
  },
  billedBy: billedPartySchema,
  billedTo: billedPartySchema,
  items: {
    type: [invoiceItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: "Invoice must contain at least one item",
    },
  },
  terms: {
    type: String,
    default: "",
  },
  footer: {
    type: String,
    default: "",
  },
  paymentMethod: {
    type: paymentMethodSchema,
    default: () => ({ type: "bank_transfer" }),
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "IDR",
  },
  createdBy: {
    type: String,
    default: "",
  },
  updatedBy: {
    type: String,
    default: "",
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

function formatDateForNumber(date) {
  const d = new Date(date || Date.now());
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = `${d.getFullYear()}`;
  return `${day}${month}${year}`;
}

async function generateUniqueInvoiceNumber(InvoiceModel, date = new Date()) {
  const base = formatDateForNumber(date);
  const maxAttempts = 15;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = Math.floor(Math.random() * 900) + 100; // 100-999
    const candidate = `INV-${base}${random}`;
    const exists = await InvoiceModel.exists({ invoiceNumber: candidate });
    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique invoice number");
}

invoiceSchema.pre("validate", async function (next) {
  if (!this.invoiceNumber) {
    try {
      this.invoiceNumber = await generateUniqueInvoiceNumber(
        this.constructor,
        this.invoiceDate || new Date()
      );
    } catch (error) {
      return next(error);
    }
  }
  next();
});

invoiceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

invoiceSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

invoiceSchema.statics.generateInvoiceNumber = function (date = new Date()) {
  return generateUniqueInvoiceNumber(this, date);
};

if (mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}

export default mongoose.model("Invoice", invoiceSchema);
