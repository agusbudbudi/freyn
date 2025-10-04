import dbConnect from "@/lib/db";
import User from "@/models/User";
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

    // Generate JWT token
    const token = generateToken(user._id.toString());

    return successResponse(
      {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
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
