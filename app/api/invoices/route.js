import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Project from "@/models/Project";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";
import {
  STATUSES,
  MAX_LOGO_BYTES,
  estimateDataUrlBytes,
  sanitizeParty,
  sanitizeItems,
  ensureInvoiceNumber,
  toInvoiceResponse,
  calculateTotals,
  sanitizePaymentMethod,
} from "./utils";

export async function GET(request) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const invoices = await Invoice.find({
      workspaceId: authUser.workspaceId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const data = invoices.map((invoice) => toInvoiceResponse(invoice));

    return successResponse({ invoices: data }, "Invoices fetched successfully");
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return errorResponse("Failed to fetch invoices", 500);
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();

    const invoiceDateRaw = body.invoiceDate || new Date();
    const invoiceDate = new Date(invoiceDateRaw);
    if (isNaN(invoiceDate.getTime())) {
      return errorResponse("Invalid invoice date", 400);
    }

    const dueDateRaw = body.dueDate || new Date();
    const dueDate = new Date(dueDateRaw);
    if (isNaN(dueDate.getTime())) {
      return errorResponse("Invalid due date", 400);
    }

    const status = STATUSES.includes(body.status) ? body.status : "draft";

    const projectIdRaw = body.projectId?.toString().trim() || "";
    let project = null;
    if (projectIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(projectIdRaw)) {
        return errorResponse("Invalid project reference", 400);
      }

      project = await Project.findOne({
        _id: projectIdRaw,
        workspaceId: authUser.workspaceId,
      });

      if (!project) {
        return errorResponse("Project not found", 404);
      }

      if (project.linkedInvoiceId && project.linkedInvoiceId !== "") {
        return errorResponse(
          "Project already linked to another invoice",
          400
        );
      }
    }

    const billedBy = sanitizeParty(body.billedBy || {});
    const billedTo = sanitizeParty(body.billedTo || {});
    const paymentMethod = sanitizePaymentMethod(body.paymentMethod || {});

    if (!billedTo.name && !billedTo.company) {
      return errorResponse("Please select a client to bill", 400);
    }

    const items = sanitizeItems(body.items);
    if (!items.length) {
      return errorResponse("Invoice must contain at least one service", 400);
    }

    const { subtotal, total } = calculateTotals(items);

    const invoiceNumber = await ensureInvoiceNumber(
      body.invoiceNumber,
      invoiceDate
    );

    const existing = await Invoice.findOne({ invoiceNumber });
    if (existing) {
      return errorResponse("Invoice number already exists", 400);
    }

    const logo = body.logo || "";
    if (logo && estimateDataUrlBytes(logo) > MAX_LOGO_BYTES) {
      return errorResponse("Logo image is too large", 400);
    }

    const invoice = await Invoice.create({
      workspaceId: authUser.workspaceId,
      projectId: project ? project._id : null,
      invoiceNumber,
      invoiceDate,
      dueDate,
      status,
      logo,
      billedBy,
      billedTo,
      items,
      terms: body.terms || "",
      footer: body.footer || "",
      paymentMethod,
      subtotal,
      total,
      currency: body.currency || "IDR",
      createdBy: authUser.userId || "",
      updatedBy: authUser.userId || "",
    });

    if (project) {
      project.linkedInvoiceId = invoice._id.toString();
      project.linkedInvoiceNumber = invoice.invoiceNumber;
      await project.save();
    }

    return successResponse(
      { invoice: toInvoiceResponse(invoice) },
      "Invoice created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return errorResponse("Failed to create invoice", 500);
  }
}
