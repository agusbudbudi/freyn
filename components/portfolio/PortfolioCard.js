import { inter } from "@/lib/fonts";
import { buildSocialLinks } from "@/lib/portfolioSocials";
import PortfolioShareButton from "./PortfolioShareButton";

const FREYN_LANDING_URL = "https://freyn.vercel.app";

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

export default function PortfolioCard({
  title,
  description,
  coverImage,
  slug,
  links = [],
  socials,
  displayName,
  bio,
  profileImage,
  clickable = true,
}) {
  const socialLinks = buildSocialLinks(socials);
  const visibleLinks = (links || []).filter(
    (link) => (link.name || link.url || "").trim().length > 0
  );
  const firstName = displayName?.split(" ").filter(Boolean)[0] || displayName;
  const shareUrl = `${FREYN_LANDING_URL}/portfolio/${slug || ""}`;

  const SocialTag = clickable ? "a" : "span";
  const socialInteractiveClasses = clickable
    ? "transition-all duration-200 hover:-translate-y-0.5 hover:bg-signal-blue hover:text-white hover:shadow-glow-blue"
    : "";
  const socialLinkProps = (href) =>
    clickable ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  const CtaTag = clickable ? "a" : "div";
  const ctaInteractiveClasses = clickable
    ? "transition-all duration-200 hover:bg-slate-800"
    : "";
  const ctaProps = clickable
    ? { href: FREYN_LANDING_URL, target: "_blank", rel: "noopener noreferrer" }
    : {};

  const LinkTag = clickable ? "a" : "div";
  const linkInteractiveClasses = clickable
    ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float"
    : "";
  const linkProps = (href) =>
    clickable ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <div
      className={`${inter.variable} font-inter portfolio-preview w-full max-w-[480px] bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden flex flex-col`}
    >
      <div className="relative h-[130px]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${title || "Portfolio"} cover image`}
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
          <PortfolioShareButton url={shareUrl} disabled={!clickable} />
        </div>
        <div className="absolute -bottom-10 right-6 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-card p-1.5">
          <img
            src={profileImage}
            alt={`${displayName} avatar`}
            className="w-full h-full rounded-full object-cover bg-[#eff6ff]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-8 px-5 pb-5 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {displayName}
          </h1>
          <span className="text-sm text-slate-500">@{slug || "your-slug"}</span>
        </div>
        {bio && (
          <p className="text-slate-600 text-sm leading-[1.7]">{bio}</p>
        )}
        {socialLinks.length > 0 && (
          <div className="flex gap-2.5 flex-wrap items-center">
            {socialLinks.map((social) => (
              <SocialTag
                key={social.key}
                {...socialLinkProps(social.href)}
                className={`w-7 h-7 rounded-full inline-flex items-center justify-center bg-signal-blue/10 text-signal-blue border border-signal-blue/20 ${socialInteractiveClasses}`}
                aria-label={social.label}
              >
                <i className={`${social.icon} text-xs`}></i>
              </SocialTag>
            ))}
          </div>
        )}
        <CtaTag
          {...ctaProps}
          className={`w-full text-center bg-slate-900 text-white py-3 px-6 rounded-full font-semibold text-sm mt-3 ${ctaInteractiveClasses}`}
        >
          Kunjungi {firstName} di Freyn
        </CtaTag>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-800">
            {title || "Your Portfolio Title"}
          </h2>
        </div>
        {description ? (
          <div
            className="text-slate-700 text-sm leading-[1.75] flex flex-col gap-4 [&_p]:mb-2 [&_ul]:mb-4 [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:pl-5 [&_li]:mb-2 [&_a]:text-signal-blue [&_a]:underline [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-200"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className="text-slate-400 text-[15px]">
            {clickable
              ? "This creator hasn't added a description yet, but stay tuned for an inspiring story."
              : "Your portfolio description will appear here."}
          </p>
        )}
      </div>

      {visibleLinks.length > 0 && (
        <div className="flex flex-col gap-4 px-5 pb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Featured Links
          </h3>
          <div className="flex flex-col gap-3">
            {visibleLinks.map((link, index) => {
              const normalizedName = link.name || formatLinkUrl(link.url);
              const displayLinkName = truncateText(normalizedName, 28);
              const displayUrl = formatLinkUrl(link.url);
              const truncatedUrl = truncateText(displayUrl, 34);

              return (
                <LinkTag
                  key={`${link.url}-${index}`}
                  {...linkProps(link.url)}
                  className={`bg-slate-50 rounded-lg py-3 px-3.5 flex items-center gap-[18px] border border-slate-100 text-inherit no-underline ${linkInteractiveClasses}`}
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
                    <span
                      className="font-semibold text-sm text-slate-800 capitalize whitespace-nowrap overflow-hidden text-ellipsis"
                      title={normalizedName}
                    >
                      {displayLinkName}
                    </span>
                    <span
                      className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis"
                      title={displayUrl}
                    >
                      {truncatedUrl}
                    </span>
                  </div>
                  <i className="uil uil-external-link-alt ml-auto text-sm text-signal-blue"></i>
                </LinkTag>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
