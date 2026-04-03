import type { Metadata, Viewport } from "next";
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
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShareBite",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

import { Toaster } from "sonner";
import { FloatingAiChat } from "@/components/ai-chat/floating-chat";
import { SocketProvider } from "@/components/providers/socket-provider";
import CookieConsent from "@/components/ui/cookie-consent";
import BugReportModal from "@/components/support/BugReportModal";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAMES } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies();
  const token = SESSION_COOKIE_NAMES
    .map((name) => cookieStore.get(name)?.value)
    .find((value): value is string => !!value);

  return (
    <html lang="en">
      <head>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body
        className={`${roboto.variable} font-sans antialiased bg-white text-slate-900`}
      >
        <SocketProvider initialToken={token}>
          {children}
          <Toaster position="top-center" richColors />
          <FloatingAiChat />
          <CookieConsent />
          <BugReportModal />
        </SocketProvider>
      </body>
    </html>
  );
}
