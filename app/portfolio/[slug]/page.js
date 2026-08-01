import Image from "next/image";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getPublicPortfolioBySlug } from "@/lib/portfolioPublic";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-12 px-4 pb-16 gap-4 max-sm:p-3">
      <div className="relative w-full max-w-[480px]">
        {portfolio.coverImage ? (
          <img
            src={portfolio.coverImage}
            alt={`${portfolio.title} cover image`}
            className="w-full max-h-[300px] rounded-2xl object-cover"
          />
        ) : (
          <div
            className="relative w-full h-[clamp(220px,40vw,320px)] rounded-3xl overflow-hidden bg-signal-blue"
            aria-hidden="true"
          ></div>
        )}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-72px] w-[152px] h-[152px] bg-white rounded-full flex items-center justify-center shadow-card p-2 max-sm:w-[100px] max-sm:h-[100px] max-sm:bottom-[-64px]">
          <div className="w-full h-full rounded-full bg-signal-blue p-1.5 flex items-center justify-center">
            <img
              src={profileImage}
              alt={`${displayName} avatar`}
              className="w-full h-full rounded-full object-cover bg-[#eff6ff] border-4 border-white"
            />
          </div>
        </div>
      </div>

      <main className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-100 pt-[60px] px-5 pb-8 shadow-card flex flex-col gap-5">
        <header className="text-center flex flex-col gap-2 items-center border-b border-slate-100">
          <div className="flex flex-col gap-2 items-center">
            <span className="uppercase tracking-[0.2em] text-xs text-signal-blue/70 font-semibold">
              Portfolio
            </span>
            <h1 className="text-[clamp(24px,5vw,30px)] font-bold text-slate-900">
              {displayName}
            </h1>
          </div>
          {bio && (
            <p className="max-w-[640px] text-slate-600 text-base leading-[1.7] max-sm:text-[15px]">
              {bio}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div className="flex justify-center w-full mt-5 mb-5">
              <div className="flex gap-3 flex-wrap items-center justify-center max-sm:gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[38px] h-[38px] rounded-full inline-flex items-center justify-center bg-signal-blue/10 text-signal-blue border border-signal-blue/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-signal-blue hover:text-white hover:shadow-glow-blue"
                    aria-label={social.label}
                  >
                    <i className={`${social.icon} text-xl`}></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-[clamp(20px,4vw,28px)] font-semibold text-slate-800">
            {portfolio.title}
          </h2>
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
          <section className="flex flex-col gap-5">
            <h3 className="text-xl font-semibold text-gray-800">
              Featured Links
            </h3>
            <div className="grid gap-[18px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-split:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] max-sm:grid-cols-1">
              {portfolio.links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 rounded-lg py-3 px-3.5 flex items-center gap-[18px] border border-slate-100 transition-all duration-200 text-inherit no-underline hover:-translate-y-1 hover:shadow-float"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center overflow-hidden text-xl font-semibold text-signal-blue shrink-0">
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
                  <i className="uil uil-external-link-alt ml-auto text-xl text-signal-blue"></i>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="w-full max-w-[480px] bg-slate-900 rounded-2xl py-6 px-6 flex flex-col items-start gap-4 text-slate-200">
        <div className="flex justify-center items-center gap-2 max-split:self-center max-split:text-center">
          <span className="text-xs uppercase text-[rgba(226,232,240,0.7)]">
            Powered by:
          </span>
          <div className="flex items-center gap-[5px] text-xl">
            <div className="w-[30px] h-[30px] overflow-hidden flex items-center justify-center gap-3">
              <Image
                src="/images/logo-freyn.png"
                alt="Freyn"
                width={30}
                height={30}
                priority
              />
            </div>
            <h3 className="m-0 text-base font-semibold text-white">Freyn</h3>
          </div>
        </div>
        <a
          href={FREYN_LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-center bg-signal-blue text-white py-3.5 px-8 rounded-full font-semibold transition-all duration-200 shadow-glow-blue hover:-translate-y-0.5 hover:shadow-glow-blue-lg"
        >
          Join {firstName} on Freyn
        </a>
      </footer>
    </div>
  );
}
