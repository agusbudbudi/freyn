export const SOCIAL_CONFIG = [
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

export function buildSocialLinks(rawSocials) {
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
