import type { Metadata } from "next";
import { JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";
import { CRITICAL_CSS_FALLBACK } from "@/lib/critical-css-fallback";
import { cn } from "@/lib/utils";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Career-Hub AI",
    template: "%s · Career-Hub AI",
  },
  description:
    "Command center for career intelligence: applications, Bio-Vault, and network CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", lora.variable, jetbrainsMono.variable)}
    >
      <head>
        <style
          id="ch-critical-css-fallback"
          dangerouslySetInnerHTML={{ __html: CRITICAL_CSS_FALLBACK }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
