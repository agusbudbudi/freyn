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
} from "../utils";

function buildInvoiceQuery(workspaceId, identifier) {
  const query = { workspaceId };

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.$or = [{ _id: identifier }, { invoiceNumber: identifier }];
  } else {
    query.invoiceNumber = identifier;
  }

  return query;
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const identifier = params?.id;
    if (!identifier) {
      return errorResponse("Invoice not found", 404);
    }

    const invoice = await Invoice.findOne(
      buildInvoiceQuery(authUser.workspaceId, identifier)
    );

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return successResponse(
      { invoice: toInvoiceResponse(invoice) },
      "Invoice fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return errorResponse("Failed to fetch invoice", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const identifier = params?.id;
    if (!identifier) {
      return errorResponse("Invoice not found", 404);
    }

    const existingInvoice = await Invoice.findOne(
      buildInvoiceQuery(authUser.workspaceId, identifier)
    );

    if (!existingInvoice) {
      return errorResponse("Invoice not found", 404);
    }

    const body = await request.json();

    const invoiceDate = new Date(body.invoiceDate || new Date());
    if (isNaN(invoiceDate.getTime())) {
      return errorResponse("Invalid invoice date", 400);
    }

    const dueDate = new Date(body.dueDate || new Date());
    if (isNaN(dueDate.getTime())) {
      return errorResponse("Invalid due date", 400);
    }

    const status = STATUSES.includes(body.status) ? body.status : "draft";

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

    const conflict = await Invoice.findOne({
      invoiceNumber,
      _id: { $ne: existingInvoice._id },
    });
    if (conflict) {
      return errorResponse("Invoice number already exists", 400);
    }

    const logo = body.logo || "";
    if (logo && estimateDataUrlBytes(logo) > MAX_LOGO_BYTES) {
      return errorResponse("Logo image is too large", 400);
    }

    const previousProjectId = existingInvoice.projectId
      ? existingInvoice.projectId.toString()
      : "";

    let nextProjectId = previousProjectId;
    let targetProject = null;

    if (Object.prototype.hasOwnProperty.call(body, "projectId")) {
      const projectIdRaw = body.projectId?.toString().trim() || "";
      if (!projectIdRaw) {
        existingInvoice.projectId = null;
        nextProjectId = "";
      } else {
        if (!mongoose.Types.ObjectId.isValid(projectIdRaw)) {
          return errorResponse("Invalid project reference", 400);
        }

        targetProject = await Project.findOne({
          _id: projectIdRaw,
          workspaceId: authUser.workspaceId,
        });

        if (!targetProject) {
          return errorResponse("Project not found", 404);
        }

        if (
          targetProject.linkedInvoiceId &&
          targetProject.linkedInvoiceId !== existingInvoice._id.toString()
        ) {
          return errorResponse(
            "Project already linked to another invoice",
            400
          );
        }

        existingInvoice.projectId = targetProject._id;
        nextProjectId = targetProject._id.toString();
      }
    }

    existingInvoice.invoiceNumber = invoiceNumber;
    existingInvoice.invoiceDate = invoiceDate;
    existingInvoice.dueDate = dueDate;
    existingInvoice.status = status;
    existingInvoice.logo = logo;
    existingInvoice.billedBy = billedBy;
    existingInvoice.billedTo = billedTo;
    existingInvoice.items = items;
    existingInvoice.terms = body.terms || "";
    existingInvoice.footer = body.footer || "";
    existingInvoice.paymentMethod = paymentMethod;
    existingInvoice.subtotal = subtotal;
    existingInvoice.total = total;
    existingInvoice.currency = body.currency || "IDR";
    existingInvoice.updatedBy = authUser.userId || "";

    const savedInvoice = await existingInvoice.save();

    if (
      previousProjectId &&
      previousProjectId !== nextProjectId
    ) {
      await Project.findOneAndUpdate(
        { _id: previousProjectId, workspaceId: authUser.workspaceId },
        { linkedInvoiceId: "", linkedInvoiceNumber: "" }
      );
    }

    if (nextProjectId) {
      await Project.findOneAndUpdate(
        { _id: nextProjectId, workspaceId: authUser.workspaceId },
        {
          linkedInvoiceId: savedInvoice._id.toString(),
          linkedInvoiceNumber: savedInvoice.invoiceNumber,
        },
        { new: false }
      );
    }

    return successResponse(
      { invoice: toInvoiceResponse(savedInvoice) },
      "Invoice updated successfully"
    );
  } catch (error) {
    console.error("Error updating invoice:", error);
    return errorResponse("Failed to update invoice", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const identifier = params?.id;
    if (!identifier) {
      return errorResponse("Invoice not found", 404);
    }

    const body = await request.json();
    const status = body.status;
    if (!STATUSES.includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    const invoice = await Invoice.findOneAndUpdate(
      buildInvoiceQuery(authUser.workspaceId, identifier),
      {
        status,
        updatedBy: authUser.userId || "",
      },
      {
        new: true,
      }
    );

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return successResponse(
      { invoice: toInvoiceResponse(invoice) },
      "Invoice status updated"
    );
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return errorResponse("Failed to update invoice status", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const authUser = await authenticateRequest(request);

    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const identifier = params?.id;
    if (!identifier) {
      return errorResponse("Invoice not found", 404);
    }

    const deletedInvoice = await Invoice.findOneAndDelete(
      buildInvoiceQuery(authUser.workspaceId, identifier)
    );

    if (!deletedInvoice) {
      return errorResponse("Invoice not found", 404);
    }

    const linkedProjectId = deletedInvoice.projectId
      ? deletedInvoice.projectId.toString()
      : "";
    if (linkedProjectId) {
      await Project.findOneAndUpdate(
        { _id: linkedProjectId, workspaceId: authUser.workspaceId },
        { linkedInvoiceId: "", linkedInvoiceNumber: "" }
      );
    }

    return successResponse(
      { invoice: toInvoiceResponse(deletedInvoice) },
      "Invoice deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return errorResponse("Failed to delete invoice", 500);
  }
}
