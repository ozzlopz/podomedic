import type { Metadata } from "next";
import "./globals.css";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import Navigation from "@/components/Navigation";

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
          <Navigation />
          <main className="flex-1 pt-24 sm:pt-28">
            {children}
          </main>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
