import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

// GET /api/clients/[id] - Get a single client
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const client = await Client.findOne({
      clientId: id,
      workspaceId: authUser.workspaceId,
    });

    if (!client) {
      return errorResponse("Client not found", 404);
    }

    return successResponse({ client }, "Client fetched successfully");
  } catch (error) {
    console.error("Error fetching client:", error);
    return errorResponse("Failed to fetch client", 500);
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const clientData = await request.json();
    clientData.updatedAt = new Date();
    clientData.workspaceId = authUser.workspaceId;

    const updatedClient = await Client.findOneAndUpdate(
      { clientId: id, workspaceId: authUser.workspaceId },
      clientData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedClient) {
      return errorResponse("Client not found", 404);
    }

    return successResponse(
      { client: updatedClient },
      "Client updated successfully"
    );
  } catch (error) {
    console.error("Error updating client:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(`A client with this ${field} already exists`, 400);
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return errorResponse(
        `Validation failed: ${validationErrors.join(", ")}`,
        400
      );
    }

    return errorResponse("Failed to update client", 500);
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const deletedClient = await Client.findOneAndDelete({
      clientId: id,
      workspaceId: authUser.workspaceId,
    });

    if (!deletedClient) {
      return errorResponse("Client not found", 404);
    }

    return successResponse(
      { client: deletedClient },
      "Client deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return errorResponse("Failed to delete client", 500);
  }
}
