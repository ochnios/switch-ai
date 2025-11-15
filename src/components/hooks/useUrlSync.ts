import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook to sync Zustand store with current URL
 * Listens to Astro's View Transition events to update state after navigation
 */
export function useUrlSync() {
  const syncFromUrl = useAppStore((state) => state.syncFromUrl);

  useEffect(() => {
    // Sync immediately on mount
    syncFromUrl();

    // Listen for Astro's page navigation events
    const handleNavigation = () => {
      syncFromUrl();
    };

    // Astro's view transition events
    document.addEventListener("astro:after-swap", handleNavigation);
    document.addEventListener("astro:page-load", handleNavigation);

    return () => {
      document.removeEventListener("astro:after-swap", handleNavigation);
      document.removeEventListener("astro:page-load", handleNavigation);
    };
  }, [syncFromUrl]);
}
