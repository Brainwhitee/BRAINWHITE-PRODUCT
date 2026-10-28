import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MarketingHeader } from "@/components/marketing-header";
import { SupportChatWidget } from "@/components/chat/SupportChatWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrainWhite — AI Developer Onboarding Platform",
  description: "AI onboarding platform turning company codebases into knowledge graphs and tailored learning paths.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MarketingHeader />
        {children}
        <SupportChatWidget />
      </body>
    </html>
  );
}
