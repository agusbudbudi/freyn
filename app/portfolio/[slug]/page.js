import Image from "next/image";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { inter } from "@/lib/fonts";
import { getPublicPortfolioBySlug } from "@/lib/portfolioPublic";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PortfolioShareButton from "@/components/portfolio/PortfolioShareButton";

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

const SOCIAL_CONFIG = [
  {
    key: "email",
    icon: "uil uil-envelope",
    label: "Email",
    buildHref: (value) =>
      value.startsWith("mailto:") ? value : `mailto:${value.trim()}`,
  },
  {
    key: "whatsapp",
    icon: "uil uil-whatsapp",
    label: "WhatsApp",
    buildHref: (value) => {
      const trimmed = value.trim();
      if (/^https?:/i.test(trimmed)) {
        return trimmed;
      }
      const digits = trimmed.replace(/[^0-9+]/g, "");
      return digits ? `https://wa.me/${digits.replace(/^[+]/, "")}` : null;
    },
  },
  {
    key: "youtube",
    icon: "uil uil-youtube",
    label: "YouTube",
  },
  {
    key: "instagram",
    icon: "uil uil-instagram",
    label: "Instagram",
  },
  {
    key: "tiktok",
    icon: "fa-brands fa-tiktok",
    label: "TikTok",
  },
  {
    key: "linkedin",
    icon: "uil uil-linkedin",
    label: "LinkedIn",
  },
  {
    key: "facebook",
    icon: "uil uil-facebook",
    label: "Facebook",
  },
  {
    key: "x",
    icon: "uil uil-twitter",
    label: "X",
  },
  {
    key: "threads",
    icon: "uil uil-at",
    label: "Threads",
  },
];

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

function formatLinkUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname;
    const search = parsed.search ? parsed.search : "";
    return `${parsed.hostname}${pathname}${search}`;
  } catch (error) {
    return url;
  }
}

function truncateText(value, maxLength = 32) {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function getLinkInitial(name, url) {
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.charAt(0).toUpperCase();
  } catch (error) {
    return "";
  }
}

function buildSocialLinks(rawSocials) {
  if (!rawSocials || typeof rawSocials !== "object") {
    return [];
  }

  const result = [];

  for (const config of SOCIAL_CONFIG) {
    const value = rawSocials[config.key];
    if (!value || !value.trim()) continue;

    const trimmed = value.trim();
    let href = trimmed;

    if (config.buildHref) {
      href = config.buildHref(trimmed);
    }

    if (!href) continue;

    result.push({
      key: config.key,
      href,
      icon: config.icon,
      label: config.label,
    });
  }

  return result;
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
  const firstName = displayName?.split(" ").filter(Boolean)[0] || displayName;
  const socialLinks = buildSocialLinks(portfolio.socials);
  const shareUrl = `${FREYN_LANDING_URL}/portfolio/${portfolio.slug}`;

  return (
    <>
      <SiteHeader />
      <div className={`${inter.variable} font-inter min-h-screen bg-gradient-to-b from-signal-blue/15 via-white to-slate-50 flex flex-col items-center gap-4 px-4 pt-20 pb-6 sm:pt-24`}>
        <main className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden flex flex-col">
          <div className="relative h-[130px]">
            {portfolio.coverImage ? (
              <img
                src={portfolio.coverImage}
                alt={`${portfolio.title} cover image`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full bg-gradient-to-br from-signal-blue/20 via-white to-purple-100"
                aria-hidden="true"
              ></div>
            )}
            <div className="absolute top-4 left-4 w-7 h-7 rounded-lg overflow-hidden">
              <img src="/images/logo-freyn.png" alt="Freyn" className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-4 right-4">
              <PortfolioShareButton url={shareUrl} />
            </div>
            <div className="absolute -bottom-10 right-6 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-card p-1.5">
              <img
                src={profileImage}
                alt={`${displayName} avatar`}
                className="w-full h-full rounded-full object-cover bg-[#eff6ff]"
              />
            </div>
          </div>

          <header className="flex flex-col gap-3 pt-8 px-5 pb-5 border-b border-slate-100">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {displayName}
              </h1>
              <span className="text-sm text-slate-500">@{portfolio.slug}</span>
            </div>
            {bio && (
              <p className="text-slate-600 text-sm leading-[1.7]">{bio}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex gap-2.5 flex-wrap items-center">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-signal-blue/10 text-signal-blue border border-signal-blue/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-signal-blue hover:text-white hover:shadow-glow-blue"
                    aria-label={social.label}
                  >
                    <i className={`${social.icon} text-xs`}></i>
                  </a>
                ))}
              </div>
            )}
            <a
              href={FREYN_LANDING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-slate-900 text-white py-3 px-6 rounded-full font-semibold text-sm transition-all duration-200 hover:bg-slate-800 mt-3"
            >
              Kunjungi {firstName} di Freyn
            </a>
          </header>

          <section className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-800">
                {portfolio.title}
              </h2>
            </div>
            {sanitizedDescription ? (
              <div
                className="text-slate-700 text-sm leading-[1.75] flex flex-col gap-4 [&_p]:mb-2 [&_ul]:mb-4 [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:pl-5 [&_li]:mb-2 [&_a]:text-signal-blue [&_a]:underline [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-200"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            ) : (
              <p className="text-slate-400 text-[15px]">
                This creator hasn&apos;t added a description yet, but stay tuned
                for an inspiring story.
              </p>
            )}
          </section>

          {portfolio.links.length > 0 && (
            <section className="flex flex-col gap-4 px-5 pb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Featured Links
              </h3>
              <div className="flex flex-col gap-3">
                {portfolio.links.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-50 rounded-lg py-3 px-3.5 flex items-center gap-[18px] border border-slate-100 transition-all duration-200 text-inherit no-underline hover:-translate-y-0.5 hover:shadow-float"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center overflow-hidden text-xl font-semibold text-signal-blue shrink-0">
                      {link.icon ? (
                        <img
                          src={link.icon}
                          alt={`${link.name} icon`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getLinkInitial(link.name, link.url)}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                      {(() => {
                        const normalizedName = link.name || formatLinkUrl(link.url);
                        const displayName = truncateText(normalizedName, 28);
                        const displayUrl = formatLinkUrl(link.url);
                        const truncatedUrl = truncateText(displayUrl, 34);
                        return (
                          <>
                            <span
                              className="font-semibold text-sm text-slate-800 capitalize whitespace-nowrap overflow-hidden text-ellipsis"
                              title={normalizedName}
                            >
                              {displayName}
                            </span>
                            <span
                              className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis"
                              title={displayUrl}
                            >
                              {truncatedUrl}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <i className="uil uil-external-link-alt ml-auto text-sm text-signal-blue"></i>
                  </a>
                ))}
              </div>
            </section>
          )}
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
