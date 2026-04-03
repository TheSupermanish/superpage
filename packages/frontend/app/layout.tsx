import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airaa - AI-Native Commerce Platform",
  description: "AI-native commerce platform where agents and humans buy, sell, and monetize digital resources on Initia. Powered by x402 and ERC-8004. The Era of AI Commerce.",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
