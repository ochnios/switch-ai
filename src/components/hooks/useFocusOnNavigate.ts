import { useEffect, useRef } from "react";

/**
 * Hook to manage focus after navigation for accessibility
 * Automatically focuses the target element when the component mounts or URL changes
 *
 * @param deps - Optional dependencies to trigger refocus
 * @returns ref to attach to the element that should receive focus
 */
export function useFocusOnNavigate<T extends HTMLElement>(deps: unknown[] = []) {
  const elementRef = useRef<T>(null);

  // Extract pathname to avoid complex expression in dependency array
  const pathname = typeof window !== "undefined" ? window.location.pathname : null;

  useEffect(() => {
    // Focus the element after navigation
    if (elementRef.current) {
      // Use a small delay to ensure the element is fully rendered
      setTimeout(() => {
        elementRef.current?.focus();
      }, 100);
    }
    // Note: Spread deps and dynamic pathname are intentional for flexible dependency tracking
  }, [...deps, pathname]);

  return elementRef;
}
