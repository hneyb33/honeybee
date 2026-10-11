import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AgeGateModal } from "@/components/layout/AgeGateModal";

export const metadata: Metadata = {
  title: "Honeybee — Trusted local people, thoughtfully connected",
  description:
    "Discover verified companions and independent specialists across Uganda. Clear profiles, upfront rates, and real local connections.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AgeGateModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
