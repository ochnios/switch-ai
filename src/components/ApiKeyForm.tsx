import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { upsertApiKeyCommandSchema } from "@/lib/schemas/api-key.schema";
import type { UpsertApiKeyCommand } from "@/types";
import type { ApiKeyStatusViewModel, FormStatus } from "@/types/ui";

type ApiKeyFormData = UpsertApiKeyCommand;

interface ApiKeyFormProps {
  currentStatus: ApiKeyStatusViewModel;
  formStatus: FormStatus;
  onSave: (data: UpsertApiKeyCommand) => Promise<void>;
  onDelete: () => Promise<void>;
}

/**
 * Form component for managing API key
 * Includes input field, save/delete buttons, and delete confirmation dialog
 */
export function ApiKeyForm({ currentStatus, formStatus, onSave, onDelete }: ApiKeyFormProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApiKeyFormData>({
    resolver: zodResolver(upsertApiKeyCommandSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const isSaving = formStatus === "saving";
  const isDeleting = formStatus === "deleting";
  const isOperationInProgress = isSaving || isDeleting;
  const isStatusLoading = currentStatus === "loading" || currentStatus === "error";

  // Handle form submission
  const onSubmit = async (data: ApiKeyFormData) => {
    await onSave(data);

    // Clear the form after save attempt (success is handled by the hook)
    reset();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    setIsDeleteDialogOpen(false);
    await onDelete();
  };

  const isSaveDisabled = isOperationInProgress || isStatusLoading;
  const isDeleteDisabled = isOperationInProgress || isStatusLoading || currentStatus === "not_exists";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
            API Key
          </label>
          <div className="relative">
            <Input
              id="apiKey"
              data-testid="api-key-input"
              type={showApiKey ? "text" : "password"}
              placeholder="sk-or-v1-..."
              disabled={isSaveDisabled}
              aria-invalid={!!errors.apiKey}
              className="pr-10"
              {...register("apiKey")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={isSaveDisabled}
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {errors.apiKey && (
            <p data-testid="api-key-validation-error" className="text-sm text-destructive" role="alert">
              {errors.apiKey.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter your OpenRouter API key. It must start with{" "}
            <code className="rounded bg-muted px-1 py-0.5">sk-or-</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button data-testid="api-key-save-button" type="submit" disabled={isSaveDisabled} className="min-w-24">
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isDeleteDisabled}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="min-w-24"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 />
                Delete
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your API key from the server. You will need to enter a new key to continue
              using the application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
