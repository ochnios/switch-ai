import type { ModelDto, MessageDto } from "@/types";

/**
 * UI/ViewModel Types
 * These types are used in the frontend components and are not part of the API contract.
 */

/**
 * AI Model type (alias for ModelDto for clearer semantics in UI code)
 * Retrieved from /api/models
 */
export type Model = ModelDto;

/**
 * Union type representing everything that can appear in the message list.
 * Enables rendering messages, errors, and loading indicators in a single list.
 */
export type DisplayMessage =
  | {
      type: "message";
      data: MessageDto;
    }
  | {
      type: "error";
      id: string; // unique ID, e.g. from timestamp
      content: string; // error message from ErrorResponseDto.message
    }
  | {
      type: "loading";
      id: string; // fixed ID, e.g. 'loading-skeleton'
    };

/**
 * ViewModel type for API key status in the settings view
 */
export type ApiKeyStatusViewModel = "loading" | "exists" | "not_exists" | "error";

/**
 * ViewModel type for form operation status in the settings view
 */
export type FormStatus = "idle" | "saving" | "deleting";
