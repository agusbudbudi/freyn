import Image from "next/image";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getPublicPortfolioBySlug } from "@/lib/portfolioPublic";
import styles from "./page.module.css";

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
    <div className={styles.page}>
      <div className={styles.hero}>
        {portfolio.coverImage ? (
          <img
            src={portfolio.coverImage}
            alt={`${portfolio.title} cover image`}
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverPlaceholder} aria-hidden="true">
            <div className={styles.coverAccent}></div>
            <div className={styles.coverAccentSecondary}></div>
          </div>
        )}
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarRing}>
            <img
              src={profileImage}
              alt={`${displayName} avatar`}
              className={styles.avatarImage}
            />
          </div>
        </div>
      </div>

      <main className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.label}>Portfolio</span>
            <h1 className={styles.name}>{displayName}</h1>
          </div>
          {bio && <p className={styles.bio}>{bio}</p>}
          {socialLinks.length > 0 && (
            <div className={styles.socialSection}>
              <div className={styles.socialList}>
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialButton}
                    aria-label={social.label}
                  >
                    <i className={`${social.icon} ${styles.socialIcon}`}></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </header>

        <section className={styles.portfolioSection}>
          <h2 className={styles.portfolioTitle}>{portfolio.title}</h2>
          {sanitizedDescription ? (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          ) : (
            <p className={styles.emptyDescription}>
              This creator hasn&apos;t added a description yet, but stay tuned
              for an inspiring story.
            </p>
          )}
        </section>

        {portfolio.links.length > 0 && (
          <section className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Featured Links</h3>
            <div className={styles.linksGrid}>
              {portfolio.links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkCard}
                >
                  <div className={styles.linkIcon}>
                    {link.icon ? (
                      <img src={link.icon} alt={`${link.name} icon`} />
                    ) : (
                      <span>{getLinkInitial(link.name, link.url)}</span>
                    )}
                  </div>
                  <div className={styles.linkContent}>
                    {(() => {
                      const normalizedName = link.name || formatLinkUrl(link.url);
                      const displayName = truncateText(normalizedName, 28);
                      const displayUrl = formatLinkUrl(link.url);
                      const truncatedUrl = truncateText(displayUrl, 34);
                      return (
                        <>
                          <span
                            className={styles.linkName}
                            title={normalizedName}
                          >
                            {displayName}
                          </span>
                          <span
                            className={styles.linkUrl}
                            title={displayUrl}
                          >
                            {truncatedUrl}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <i
                    className={`uil uil-external-link-alt ${styles.linkExternal}`}
                  ></i>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBranding}>
          <span className={styles.supported}>Powered by:</span>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <Image
                src="/images/logo-freyn.png"
                alt="Freyn"
                width={30}
                height={30}
                priority
              />
            </div>
            <h3 class="social-title">Freyn</h3>
          </div>
        </div>
        <a
          href={FREYN_LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.joinButton}
        >
          Join {firstName} on Freyn
        </a>
      </footer>
    </div>
  );
}
