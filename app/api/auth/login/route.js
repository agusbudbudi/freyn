import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
  generateToken,
  isValidEmail,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse("Please enter a valid email address", 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // Ensure workspace exists
    let workspace = null;
    if (user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    if (!workspace) {
      workspace = await Workspace.findOne({ owner: user._id });
    }

    if (!workspace) {
      workspace = await Workspace.create({
        name: `${user.fullName}'s Workspace`,
        owner: user._id,
        slug: `workspace-${user.userId.toLowerCase()}`,
      });
      await User.findByIdAndUpdate(user._id, {
        workspaceId: workspace._id,
      });
    } else if (!user.workspaceId) {
      await User.findByIdAndUpdate(user._id, {
        workspaceId: workspace._id,
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
    });

    return successResponse(
      {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "",
          createdAt: user.createdAt,
          workspaceId: workspace._id.toString(),
        },
        workspace: {
          id: workspace._id.toString(),
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
        },
        token,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
