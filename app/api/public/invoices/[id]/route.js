import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { errorResponse, successResponse } from "@/lib/auth";
import { toInvoiceResponse } from "@/app/api/invoices/utils";

export async function GET(_, { params }) {
  try {
    await dbConnect();

    const { id } = params || {};

    if (!id) {
      return errorResponse("Invoice not found", 404);
    }

    const invoice = await Invoice.findOne({
      $or: [{ _id: id }, { invoiceNumber: id }],
    });

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return successResponse(
      { invoice: toInvoiceResponse(invoice) },
      "Invoice fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching public invoice:", error);
    return errorResponse("Failed to fetch invoice", 500);
  }
}
