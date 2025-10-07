import { errorResponse, successResponse } from "@/lib/auth";
import { getPublicPortfolioBySlug } from "@/lib/portfolioPublic";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const slug = params?.slug || "";
    const portfolio = await getPublicPortfolioBySlug(slug);

    if (!portfolio) {
      return errorResponse("Portfolio not found", 404);
    }

    return successResponse({ portfolio }, "Portfolio fetched successfully");
  } catch (error) {
    console.error("Error fetching public portfolio:", error);
    return errorResponse("Failed to fetch portfolio", 500);
  }
}
