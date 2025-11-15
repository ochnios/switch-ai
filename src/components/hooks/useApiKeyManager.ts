import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import type { ApiKeyExistsDto, UpsertApiKeyCommand, SuccessResponseDto, ErrorResponseDto } from "@/types";
import type { ApiKeyStatusViewModel, FormStatus } from "@/types/ui";

/**
 * Custom hook for managing API key state and operations
 * Handles checking, saving, and deleting API keys with proper error handling
 * Syncs with global store after operations
 */
export function useApiKeyManager() {
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatusViewModel>("loading");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [apiError, setApiError] = useState<ErrorResponseDto | null>(null);
  const fetchApiKeyStatus = useAppStore((state) => state.fetchApiKeyStatus);
  const fetchModels = useAppStore((state) => state.fetchModels);

  /**
   * Check if API key exists for the current user
   * Called on component mount
   */
  const checkKeyStatus = async () => {
    try {
      const response = await fetch("/api/api-key");

      if (!response.ok) {
        setKeyStatus("error");
        return;
      }

      const data: ApiKeyExistsDto = await response.json();
      setKeyStatus(data.exists ? "exists" : "not_exists");
    } catch {
      setKeyStatus("error");
    }
  };

  /**
   * Save or update the API key
   * @param data - Command containing the API key to save
   */
  const saveKey = async (data: UpsertApiKeyCommand) => {
    setFormStatus("saving");
    setApiError(null);

    try {
      const response = await fetch("/api/api-key", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDto = await response.json();
        setApiError(errorData);
        setFormStatus("idle");
        return;
      }

      const successData: SuccessResponseDto = await response.json();

      // Update local state
      setKeyStatus("exists");
      setFormStatus("idle");

      // Sync with global store - update API key status and fetch models
      await Promise.all([fetchApiKeyStatus(), fetchModels()]);

      // Show success notification
      toast.success(successData.message || "API key saved successfully");
    } catch {
      setApiError({
        statusCode: 0,
        message: "Network error. Please check your connection and try again.",
      });
      setFormStatus("idle");
    }
  };

  /**
   * Delete the API key
   */
  const deleteKey = async () => {
    setFormStatus("deleting");
    setApiError(null);

    try {
      const response = await fetch("/api/api-key", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData: ErrorResponseDto = await response.json();
        setApiError(errorData);
        setFormStatus("idle");
        return;
      }

      // Update local state
      setKeyStatus("not_exists");
      setFormStatus("idle");

      // Sync with global store - update API key status and clear models
      await fetchApiKeyStatus();
      // Clear models list since API key is deleted
      useAppStore.setState({ modelsList: [] });

      // Show success notification
      toast.success("API key deleted successfully");
    } catch {
      setApiError({
        statusCode: 0,
        message: "Network error. Please check your connection and try again.",
      });
      setFormStatus("idle");
    }
  };

  /**
   * Clear the current API error
   */
  const clearApiError = () => {
    setApiError(null);
  };

  // Check key status on mount
  useEffect(() => {
    checkKeyStatus();
  }, []);

  return {
    keyStatus,
    formStatus,
    apiError,
    saveKey,
    deleteKey,
    clearApiError,
  };
}
