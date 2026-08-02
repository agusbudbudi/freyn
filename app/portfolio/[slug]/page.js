import Image from "next/image";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { inter } from "@/lib/fonts";
import { getPublicPortfolioBySlug } from "@/lib/portfolioPublic";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PortfolioCard from "@/components/portfolio/PortfolioCard";

export const dynamic = "force-dynamic";

const DESCRIPTION_SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "code",
    "pre",
    "a",
    "span",
    "b",
    "i",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    code: ["class"],
    span: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

const FREYN_LANDING_URL = "https://freyn.vercel.app";

export async function generateMetadata({ params }) {
  const portfolio = await getPublicPortfolioBySlug(params?.slug || "");

  if (!portfolio) {
    return {
      title: "Portfolio | Freyn",
      description: "Discover inspiring portfolios from the Freyn community.",
    };
  }

  const ownerName =
    portfolio.owner?.fullName || portfolio.workspaceName || "Creator";
  const plainDescription = sanitizeHtml(portfolio.description || "", {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: `${portfolio.title} | ${ownerName}`,
    description:
      plainDescription ||
      `Explore ${portfolio.title} by ${ownerName} on Freyn and discover their creative journey.`,
    openGraph: {
      title: `${portfolio.title} | ${ownerName}`,
      description:
        plainDescription ||
        `Explore ${portfolio.title} by ${ownerName} on Freyn and discover their creative journey.`,
      images: portfolio.coverImage
        ? [
          {
            url: portfolio.coverImage,
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${portfolio.title} | ${ownerName}`,
      description:
        plainDescription ||
        `Explore ${portfolio.title} by ${ownerName} on Freyn and discover their creative journey.`,
      images: portfolio.coverImage ? [portfolio.coverImage] : undefined,
    },
  };
}

function sanitizeDescription(html) {
  if (!html) return "";
  return sanitizeHtml(html, DESCRIPTION_SANITIZE_OPTIONS);
}

function createAvatarSeed(name, fallback) {
  if (name) return name;
  if (fallback) return fallback;
  return "freyn-creator";
}

function getProfileImage(portfolio, displayName) {
  const provided = portfolio.owner?.profileImage;
  if (provided) {
    return provided;
  }

  const seed = createAvatarSeed(displayName, portfolio.slug);
  return `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=${encodeURIComponent(
    seed
  )}`;
}

export default async function PortfolioPublicPage({ params }) {
  const portfolio = await getPublicPortfolioBySlug(params?.slug || "");

  if (!portfolio) {
    notFound();
  }

  const displayName =
    portfolio.owner?.fullName || portfolio.workspaceName || "Freyn Creator";
  const bio = portfolio.owner?.bio || "";
  const sanitizedDescription = sanitizeDescription(portfolio.description);
  const profileImage = getProfileImage(portfolio, displayName);

  return (
    <>
      <SiteHeader />
      <div className={`${inter.variable} font-inter min-h-screen bg-gradient-to-b from-signal-blue/15 via-white to-slate-50 flex flex-col items-center gap-4 px-4 pt-20 pb-6 sm:pt-24`}>
        <main className="w-full max-w-[480px]">
          <PortfolioCard
            title={portfolio.title}
            description={sanitizedDescription}
            coverImage={portfolio.coverImage}
            slug={portfolio.slug}
            links={portfolio.links}
            socials={portfolio.socials}
            displayName={displayName}
            bio={bio}
            profileImage={profileImage}
          />
        </main>

        <a
          href={FREYN_LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-400 text-xs no-underline hover:text-slate-600"
        >
          <span>Powered by</span>
          <Image
            src="/images/logo-freyn.png"
            alt="Freyn"
            width={16}
            height={16}
          />
          <span className="font-semibold text-slate-500">Freyn</span>
        </a>
      </div>
      <SiteFooter />
    </>
  );
}
