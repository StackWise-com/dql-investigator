import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "DQL Detective",
  description: "Solve mysteries with Dynatrace Query Language. An immersive, story-driven detective game where you hunt bugs, breaches, and thieves using DQL pipelines.",
  keywords: ["DQL", "Dynatrace", "query language", "detective", "game", "learning", "observability"],
  authors: [{ name: "StackWise" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "DQL Detective",
    description: "Solve mysteries with Dynatrace Query Language. An immersive, story-driven detective game where you hunt bugs, breaches, and thieves using DQL pipelines.",
    type: "website",
    siteName: "DQL Detective",
    images: ["/og-image.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DQL Detective",
    description: "Solve mysteries with Dynatrace Query Language. An immersive, story-driven detective game where you hunt bugs, breaches, and thieves using DQL pipelines.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-slate-950 text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
