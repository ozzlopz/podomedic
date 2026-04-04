import type { Metadata } from "next";
import "./globals.css";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Podomedic",
  description: "Plataforma web para consultorio podológico",
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
          <SiteChrome>{children}</SiteChrome>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
