"use client";

import { useEffect } from "react";

const DEV_SW_CLEANUP_FLAG = "__sharebite_dev_sw_cleanup_done__";

export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const cleanup = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          const staleCacheNames = cacheNames.filter(
            (name) =>
              name.includes("workbox") ||
              name.includes("next") ||
              name.includes("start-url") ||
              name.includes("runtime")
          );

          await Promise.all(staleCacheNames.map((name) => caches.delete(name)));
        }

        // Reload exactly once after cleanup so old SW control is dropped.
        if (!sessionStorage.getItem(DEV_SW_CLEANUP_FLAG)) {
          sessionStorage.setItem(DEV_SW_CLEANUP_FLAG, "1");
          window.location.reload();
        }
      } catch (error) {
        console.warn("Dev service worker cleanup failed:", error);
      }
    };

    cleanup();
  }, []);

  return null;
}
