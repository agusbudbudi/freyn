import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { errorResponse, successResponse } from "@/lib/auth";

// POST /api/projects/[id]/comments - Add a comment to a project
export async function POST(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const { content, authorName, authorEmail, authorAvatar, isClient } =
      await request.json();

    // Validate required fields
    if (!content || !authorName || !authorEmail) {
      return errorResponse(
        "Content, author name, and author email are required",
        400
      );
    }

    const project = await Project.findOne({ _id: id });
    if (!project) {
      return errorResponse("Project not found", 404);
    }

    const newComment = {
      id: Date.now().toString(),
      content: content.trim(),
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      authorAvatar: authorAvatar || "",
      isClient: isClient || false,
      createdAt: new Date(),
    };

    project.comments.push(newComment);
    project.updatedAt = new Date();

    const savedProject = await project.save();

    return successResponse(
      {
        comment: newComment,
        project: savedProject,
      },
      "Comment added successfully",
      201
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return errorResponse("Failed to add comment", 500);
  }
}
