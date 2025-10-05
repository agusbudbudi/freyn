import "./globals.css";
import "../styles/global.css";
import "../styles/theme.css";

export const metadata = {
  title: "Freyn - Freelance Management System",
  description: "Your All-in-One Freelance Management System",
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
