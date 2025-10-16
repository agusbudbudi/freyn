import "./globals.css";
import "../styles/global.css";
import "../styles/theme.css";
import "../styles/invoices.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";
import "../styles/invoice-public.css";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "";
};

const baseUrl = getBaseUrl();
const faviconPath = "/icon.png";

export const metadata = {
  title: "Freyn - Freelance Management System",
  description: "Your All-in-One Freelance Management System",
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
    apple: faviconPath,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://unicons.iconscout.com/release/v4.0.0/css/line.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
