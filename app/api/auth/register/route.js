import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
  generateToken,
  generateUniqueUserId,
  isValidEmail,
  validatePassword,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { fullName, email, password } = body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return errorResponse("All fields are required", 400);
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      return errorResponse("Full name must be at least 2 characters long", 400);
    }

    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      return errorResponse(
        "Full name can only contain letters and spaces",
        400
      );
    }

    // Validate email
    if (!isValidEmail(email)) {
      return errorResponse("Please enter a valid email address", 400);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return errorResponse(passwordValidation.message, 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse("Email already exists", 400);
    }

    // Generate unique user ID
    const userId = await generateUniqueUserId(User);

    // Create new user
    const user = new User({
      userId,
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password, // Will be hashed by the pre-save middleware
    });

    await user.save();

    const joinedAt = new Date();

    // Create workspace for the user
    const workspaceName = `${fullName.trim()}'s Workspace`;
    const workspaceSlug = `workspace-${user.userId.toLowerCase()}`;

    let workspace;
    try {
      workspace = await Workspace.create({
        name: workspaceName,
        owner: user._id,
        slug: workspaceSlug,
        members: [
          {
            user: user._id,
            role: "owner",
            joinedAt,
          },
        ],
      });
    } catch (workspaceError) {
      console.error("Workspace creation error:", workspaceError);
      await User.findByIdAndDelete(user._id);
      return errorResponse(
        "Failed to initialize workspace. Please try registering again.",
        500
      );
    }

    // Link workspace to user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        workspaceId: workspace._id,
        workspaceRole: "owner",
        workspaceJoinedAt: joinedAt,
        $push: {
          workspaces: {
            workspace: workspace._id,
            role: "owner",
            joinedAt,
          },
        },
      },
      { new: true }
    );

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
    });

    return successResponse(
      {
        user: {
          userId: updatedUser.userId,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          createdAt: updatedUser.createdAt,
          workspaceId: workspace._id.toString(),
          workspaceRole: updatedUser.workspaceRole,
          workspaceJoinedAt: updatedUser.workspaceJoinedAt,
          workspaces: (updatedUser.workspaces || []).map((entry) => ({
            workspaceId: entry.workspace?.toString() || null,
            role: entry.role,
            joinedAt: entry.joinedAt,
          })),
        },
        workspace: {
          id: workspace._id.toString(),
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
        },
        token,
      },
      "Account created successfully",
      201
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate key error (in case email uniqueness fails at DB level)
    if (error.code === 11000) {
      return errorResponse("Email already exists", 400);
    }

    return errorResponse("Registration failed. Please try again.", 500);
  }
}
