import { useApiKeyManager } from "@/components/hooks/useApiKeyManager";
import { ApiKeyStatusBadge } from "@/components/ApiKeyStatusBadge";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { SecurityInfo } from "@/components/SecurityInfo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Main settings view component
 * Renders the API key management interface with status, form, and security information
 */
export function SettingsView() {
  const { keyStatus, formStatus, apiError, saveKey, deleteKey, clearApiError } = useApiKeyManager();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage settings and preferences</p>
      </div>

      {/* API Key Section */}
      <div data-testid="api-key-section" className="space-y-4 rounded-lg border bg-card p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Key Management</h2>
            <ApiKeyStatusBadge status={keyStatus} />
          </div>
          <p data-testid="api-key-instruction-text" className="text-sm text-muted-foreground">
            Enter your OpenRouter API key to start using the application. Get your key from{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              OpenRouter
            </a>
            .
          </p>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p>{apiError.message}</p>
                  {apiError.errors && apiError.errors.length > 0 && (
                    <ul className="list-inside list-disc text-sm">
                      {apiError.errors.map((error, index) => (
                        <li key={index}>
                          <span className="font-medium">{error.field}:</span> {error.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={clearApiError}
                  aria-label="Dismiss error"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* API Key Form */}
        <ApiKeyForm currentStatus={keyStatus} formStatus={formStatus} onSave={saveKey} onDelete={deleteKey} />

        {/* Security Information */}
        <SecurityInfo />
      </div>
    </div>
  );
}
