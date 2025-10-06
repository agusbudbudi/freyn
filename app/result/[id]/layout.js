const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "";
};

export function generateMetadata({ params }) {
  const title = "Freyn Project Progress Tracker";
  const description =
    "Pantau perkembangan proyek Anda secara real-time melalui portal Freyn.";

  const baseUrl = getBaseUrl();

  const imageUrl = baseUrl
    ? new URL("/images/logo-freyn.png", baseUrl).toString()
    : "/images/logo-freyn.png";

  const pageUrl = baseUrl
    ? new URL(`/result/${params?.id ?? ""}`, baseUrl).toString()
    : undefined;

  return {
    title,
    description,
    icons: {
      icon: imageUrl,
      shortcut: imageUrl,
      apple: imageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Freyn",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Freyn Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ResultLayout({ children }) {
  return children;
}
