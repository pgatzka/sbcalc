import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Cinzel, Outfit } from "next/font/google";
import { Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { Providers } from "@/components/providers";

const fontDisplay = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
});

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <GoogleAnalytics gaId="G-Y6TX20JW9F" />
        <GoogleTagManager gtmId="GT-MK5DGL8J" />
      </body>
    </html>
  );
}
