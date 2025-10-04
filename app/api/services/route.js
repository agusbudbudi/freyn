import dbConnect from "@/lib/db";
import Service from "@/models/Service";
import { errorResponse, successResponse } from "@/lib/auth";

// GET /api/services - Get all services
export async function GET(request) {
  try {
    await dbConnect();

    const services = await Service.find().sort({ createdAt: -1 });

    return successResponse({ services }, "Services fetched successfully");
  } catch (error) {
    console.error("Error fetching services:", error);
    return errorResponse("Failed to fetch services", 500);
  }
}

// POST /api/services - Create a new service
export async function POST(request) {
  try {
    await dbConnect();

    const serviceData = await request.json();

    // Generate unique ID if not provided
    if (!serviceData.id) {
      serviceData.id = Date.now().toString();
    }

    // Validate required fields
    if (!serviceData.serviceName) {
      return errorResponse("Service name is required", 400);
    }

    if (!serviceData.servicePrice || serviceData.servicePrice < 0) {
      return errorResponse("Valid service price is required", 400);
    }

    if (!serviceData.durationOfWork || serviceData.durationOfWork < 1) {
      return errorResponse("Valid duration of work is required", 400);
    }

    const service = new Service(serviceData);
    const savedService = await service.save();

    return successResponse(
      { service: savedService },
      "Service created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating service:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(`A service with this ${field} already exists`, 400);
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

    return errorResponse("Failed to create service", 500);
  }
}
