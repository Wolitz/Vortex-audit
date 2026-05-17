import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// This optimizes the font and prevents layout shift
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Policy Auditor | Video Compliance Check",
  description: "Scan your videos for YouTube monetization risks and policy violations before you upload.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}