import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { errorResponse, successResponse } from "@/lib/auth";

// GET /api/clients - Get all clients
export async function GET(request) {
  try {
    await dbConnect();

    const clients = await Client.find().sort({ createdAt: -1 });

    return successResponse({ clients }, "Clients fetched successfully");
  } catch (error) {
    console.error("Error fetching clients:", error);
    return errorResponse("Failed to fetch clients", 500);
  }
}

// POST /api/clients - Create a new client
export async function POST(request) {
  try {
    await dbConnect();

    const clientData = await request.json();

    // Generate unique ID and clientId if not provided
    if (!clientData.id || !clientData.clientId) {
      const generatedId = `C${Date.now()}`;
      clientData.id = generatedId;
      clientData.clientId = generatedId;
    }

    // Validate required fields
    if (!clientData.clientName) {
      return errorResponse("Client name is required", 400);
    }

    const client = new Client(clientData);
    const savedClient = await client.save();

    return successResponse(
      { client: savedClient },
      "Client created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating client:", error);

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

    return errorResponse("Failed to create client", 500);
  }
}
