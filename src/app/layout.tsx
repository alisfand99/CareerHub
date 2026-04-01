import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Career-Hub AI",
    template: "%s · Career-Hub AI",
  },
  description:
    "Dynamic career intelligence: applications, Bio-Vault skill engine, and network CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
