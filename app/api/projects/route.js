import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import {
  authenticateRequest,
  errorResponse,
  successResponse,
} from "@/lib/auth";

async function generateUniqueNumberOrder() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`;

  for (let attempt = 0; attempt < 25; attempt++) {
    const randomSuffix = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
    const candidate = `FM-${dateStr}-${randomSuffix}`;
    const exists = await Project.exists({ numberOrder: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // As a last resort, append timestamp segment to guarantee uniqueness
  const fallbackSuffix = String(Date.now()).slice(-5).padStart(5, "0");
  return `FM-${dateStr}-${fallbackSuffix}`;
}

// GET /api/projects - Get all projects
export async function GET(request) {
  try {
    await dbConnect();

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const projects = await Project.find({
      workspaceId: authUser.workspaceId,
    }).sort({ createdAt: -1 });

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

    const authUser = await authenticateRequest(request);
    if (!authUser?.workspaceId) {
      return errorResponse("Unauthorized", 401);
    }

    const projectData = await request.json();

    projectData.workspaceId = authUser.workspaceId;

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

    if (!projectData.numberOrder) {
      projectData.numberOrder = await generateUniqueNumberOrder();
    } else {
      const existingNumberOrder = await Project.exists({
        numberOrder: projectData.numberOrder,
      });
      if (existingNumberOrder) {
        projectData.numberOrder = await generateUniqueNumberOrder();
      }
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
