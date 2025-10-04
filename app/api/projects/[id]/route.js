import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { errorResponse, successResponse } from "@/lib/auth";

// GET /api/projects/[id] - Get a single project
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const project = await Project.findOne({ _id: id });

    if (!project) {
      return errorResponse("Project not found", 404);
    }

    return successResponse({ project }, "Project fetched successfully");
  } catch (error) {
    console.error("Error fetching project:", error);
    return errorResponse("Failed to fetch project", 500);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const projectData = await request.json();
    projectData.updatedAt = new Date();

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id },
      projectData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProject) {
      return errorResponse("Project not found", 404);
    }

    return successResponse(
      { project: updatedProject },
      "Project updated successfully"
    );
  } catch (error) {
    console.error("Error updating project:", error);

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

    return errorResponse("Failed to update project", 500);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const deletedProject = await Project.findOneAndDelete({ _id: id });

    if (!deletedProject) {
      return errorResponse("Project not found", 404);
    }

    return successResponse(
      { project: deletedProject },
      "Project deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return errorResponse("Failed to delete project", 500);
  }
}
