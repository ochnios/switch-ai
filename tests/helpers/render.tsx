import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Custom render function that wraps components with common providers
 */
type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & {
  // Add any provider-specific options here
  // For example: initialStoreState?: Partial<AppState>
};

/**
 * Wrapper component that provides all necessary context providers
 */
function AllTheProviders({ children }: { children: ReactNode }) {
  // Add providers here as needed
  // Example:
  // return (
  //   <ThemeProvider>
  //     <QueryClientProvider client={queryClient}>
  //       {children}
  //     </QueryClientProvider>
  //   </ThemeProvider>
  // );
  return <>{children}</>;
}

/**
 * Custom render function for testing React components
 * @param ui - React element to render
 * @param options - Render options
 */
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { renderWithProviders as render };
