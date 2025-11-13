import { ShieldCheck } from "lucide-react";

/**
 * Static informational component explaining API key security
 * Informs users that their key is encrypted and not displayed after saving
 */
export function SecurityInfo() {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
      <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Secure Storage</p>
        <p className="text-sm text-muted-foreground">
          Your API key is encrypted and stored securely on the server. For security reasons, the
          key cannot be retrieved or displayed after being saved. You can only check if a key
          exists or replace it with a new one.
        </p>
      </div>
    </div>
  );
}

