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
import Script from "next/script";

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
        {process.env.NODE_ENV === "development" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    var key = "__sharebite_sw_boot_cleanup_done__";
                    if (sessionStorage.getItem(key)) return;
                    sessionStorage.setItem(key, "1");

                    var swPromise = Promise.resolve();
                    if ("serviceWorker" in navigator) {
                      swPromise = navigator.serviceWorker.getRegistrations().then(function (registrations) {
                        return Promise.all(
                          registrations.map(function (registration) {
                            return registration.unregister();
                          })
                        );
                      });
                    }

                    var cachePromise = Promise.resolve();
                    if ("caches" in window) {
                      cachePromise = caches.keys().then(function (names) {
                        return Promise.all(
                          names
                            .filter(function (name) {
                              return (
                                name.indexOf("workbox") >= 0 ||
                                name.indexOf("next") >= 0 ||
                                name.indexOf("start-url") >= 0 ||
                                name.indexOf("runtime") >= 0
                              );
                            })
                            .map(function (name) {
                              return caches.delete(name);
                            })
                        );
                      });
                    }

                    Promise.allSettled([swPromise, cachePromise]).then(function () {
                      window.location.reload();
                    });
                  } catch (_) {}
                })();
              `,
            }}
          />
        ) : null}
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
        {process.env.NODE_ENV === "production" ? (
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7449708956977518"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
        <meta name="google-adsense-account" content="ca-pub-7449708956977518" />
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
