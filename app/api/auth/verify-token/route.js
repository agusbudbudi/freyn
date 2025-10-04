import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  getTokenFromRequest,
  verifyToken,
  errorResponse,
  successResponse,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    // Get and verify token
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse("Access token is required", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse("Invalid or expired token", 401);
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
        },
      },
      "Token is valid"
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return errorResponse("Token verification failed", 500);
  }
}
