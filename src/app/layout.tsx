import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AgeGate } from "@/components/layout/AgeGate";

export const metadata: Metadata = {
  title: "Honeybee — Connect. Refresh. Chill.",
  description:
    "Discover verified companions and independent specialists across Uganda. Clear profiles, upfront rates, and real local connections.",
  icons: {
    icon: "/images/logo.jpeg",
    apple: "/images/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" forcedTheme="dark">
          <AgeGate>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AgeGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
