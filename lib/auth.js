import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

/**
 * Generate JWT token
 * @param {string} userId - User ID to encode in token
 * @returns {string} JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token data
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Get token from request headers or cookies
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token if found
 */
export function getTokenFromRequest(request) {
  // Try to get from Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get from cookies
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  return token?.value || null;
}

/**
 * Authenticate request and get user
 * @param {Request} request - Next.js request object
 * @returns {Object|null} User object if authenticated, null otherwise
 */
export async function authenticateRequest(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  return decoded;
}

/**
 * Generate unique 5-digit user ID
 * @param {Model} User - Mongoose User model
 * @returns {Promise<string>} Unique user ID
 */
export async function generateUniqueUserId(User) {
  let userId;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random 5-digit number (10000-99999)
    userId = Math.floor(Math.random() * 90000) + 10000;
    userId = userId.toString();

    // Check if this ID already exists
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return userId;
    }
    attempts++;
  }

  throw new Error("Unable to generate unique user ID after multiple attempts");
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  return { isValid: true, message: "Password is valid" };
}

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export function errorResponse(message, status = 400) {
  return Response.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

/**
 * Create success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 * @returns {Response} Next.js Response object
 */
export function successResponse(data, message = "Success", status = 200) {
  return Response.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}
