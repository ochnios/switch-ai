import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ApiKeyStatusViewModel } from "@/types/ui";

interface ApiKeyStatusBadgeProps {
  status: ApiKeyStatusViewModel;
}

/**
 * Badge component showing the current API key status
 * Displays different variants and icons based on the key state
 */
export function ApiKeyStatusBadge({ status }: ApiKeyStatusBadgeProps) {
  if (status === "loading") {
    return (
      <Badge variant="outline">
        <Loader2 className="animate-spin" />
        Checking status...
      </Badge>
    );
  }

  if (status === "exists") {
    return (
      <Badge data-testid="api-key-status-badge" variant="default" className="bg-green-600 hover:bg-green-600">
        <CheckCircle2 />
        API Key Saved
      </Badge>
    );
  }

  if (status === "not_exists") {
    return (
      <Badge data-testid="api-key-status-badge" variant="destructive">
        <XCircle />
        No API Key
      </Badge>
    );
  }

  // error state
  return (
    <Badge data-testid="api-key-status-badge" variant="destructive">
      <AlertCircle />
      Error checking status
    </Badge>
  );
}
