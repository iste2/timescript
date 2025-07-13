import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timescript",
  description: "AI-powered time tracking that converts natural language work descriptions into formatted time entries",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
