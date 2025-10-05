import dbConnect from "@/lib/db";
import Service from "@/models/Service";
import { errorResponse, successResponse } from "@/lib/auth";

// GET /api/services/[id] - Get a single service
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const service = await Service.findOne({ id });

    if (!service) {
      return errorResponse("Service not found", 404);
    }

    return successResponse({ service }, "Service fetched successfully");
  } catch (error) {
    console.error("Error fetching service:", error);
    return errorResponse("Failed to fetch service", 500);
  }
}

// PUT /api/services/[id] - Update a service
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const serviceData = await request.json();
    // Do not allow changing primary identifier
    if ("id" in serviceData) {
      delete serviceData.id;
    }
    serviceData.updatedAt = new Date();

    const updatedService = await Service.findOneAndUpdate({ id }, serviceData, {
      new: true,
      runValidators: true,
    });

    if (!updatedService) {
      return errorResponse("Service not found", 404);
    }

    return successResponse(
      { service: updatedService },
      "Service updated successfully"
    );
  } catch (error) {
    console.error("Error updating service:", error);

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

    return errorResponse("Failed to update service", 500);
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const deletedService = await Service.findOneAndDelete({ id });

    if (!deletedService) {
      return errorResponse("Service not found", 404);
    }

    return successResponse(
      { service: deletedService },
      "Service deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting service:", error);
    return errorResponse("Failed to delete service", 500);
  }
}
