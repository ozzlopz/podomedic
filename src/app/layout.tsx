import type { Metadata } from "next";
import "./globals.css";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import CartProviderWrapper from "@/components/CartProviderWrapper";
import SiteChrome from "@/components/SiteChrome";
import { seoKeywords, siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: seoKeywords,
  alternates: {
    canonical: "/",
  },
  category: "healthcare",
  manifest: "/images/favicon/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/images/logo.png",
        width: 1080,
        height: 1080,
        alt: "PodoMedic, podología médica en Pachuca",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProviderWrapper>
          <CartProviderWrapper>
            <SiteChrome>{children}</SiteChrome>
          </CartProviderWrapper>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
