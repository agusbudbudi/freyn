import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { errorResponse, successResponse } from "@/lib/auth";

// GET /api/projects - Get all projects
export async function GET(request) {
  try {
    await dbConnect();

    const projects = await Project.find().sort({ createdAt: -1 });

    return successResponse({ projects }, "Projects fetched successfully");
  } catch (error) {
    console.error("Error fetching projects:", error);
    return errorResponse("Failed to fetch projects", 500);
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    await dbConnect();

    const projectData = await request.json();

    // Normalize numeric fields to numbers (allow 0 as valid)
    if (projectData.price !== undefined) {
      projectData.price = Number(projectData.price);
    }
    if (projectData.totalPrice !== undefined) {
      projectData.totalPrice = Number(projectData.totalPrice);
    }

    // Generate unique ID if not provided
    if (!projectData.id) {
      projectData.id = Date.now().toString();
    }

    // Validate required fields
    if (!projectData.projectName) {
      return errorResponse("Project name is required", 400);
    }

    if (!projectData.clientName) {
      return errorResponse("Client name is required", 400);
    }

    if (!projectData.deadline) {
      return errorResponse("Deadline is required", 400);
    }

    const price = projectData.price;
    if (!Number.isFinite(price) || price < 0) {
      return errorResponse("Valid price is required", 400);
    }

    const totalPrice = projectData.totalPrice;
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      return errorResponse("Valid total price is required", 400);
    }

    const project = new Project(projectData);
    const savedProject = await project.save();

    return successResponse(
      { project: savedProject },
      "Project created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating project:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(`A project with this ${field} already exists`, 400);
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

    return errorResponse("Failed to create project", 500);
  }
}
