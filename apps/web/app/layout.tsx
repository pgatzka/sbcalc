import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Exo_2, Inter, JetBrains_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { Providers } from "@/components/providers";

const fontDisplay = Exo_2({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
