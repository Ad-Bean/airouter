import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import { FreeUserNotification } from "@/components/FreeUserNotification";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIRouter - The Multimodal AI Interface",
  description:
    "Route your AI requests across multiple vision models with intelligent load balancing, competitive pricing, and zero-downtime infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <FreeUserNotification />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
