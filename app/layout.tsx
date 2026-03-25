import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ['400', '500', '700', '900'],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "ShareBite",
  description: "The world's most sophisticated food-sharing engine.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#f97316",
};

import { Toaster } from "sonner";
import { FloatingAiChat } from "@/components/ai-chat/floating-chat";
import { SocketProvider } from "@/components/providers/socket-provider";
import CookieConsent from "@/components/ui/cookie-consent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body
        className={`${roboto.variable} font-sans antialiased bg-white text-slate-900`}
      >
        <SocketProvider>
          {children}
          <Toaster position="top-center" richColors />
          <FloatingAiChat />
          <CookieConsent />
        </SocketProvider>
      </body>
    </html>
  );
}
