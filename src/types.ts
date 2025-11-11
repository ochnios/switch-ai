import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// Entity Types (Direct Database Mappings)
// ============================================================================

/**
 * Conversation entity from database
 */
export type Conversation = Tables<"conversations">;

/**
 * Message entity from database
 */
export type Message = Tables<"messages">;

/**
 * API Key entity from database
 */
export type ApiKey = Tables<"api_keys">;

/**
 * Message role enum from database
 */
export type MessageRole = Enums<"message_role">;

// ============================================================================
// Command Models (Request DTOs)
// ============================================================================

/**
 * Command to upsert (create or update) an API key
 * @endpoint PUT /api/api-key
 */
export interface UpsertApiKeyCommand {
  apiKey: string;
}

/**
 * Command to create a new conversation from the first message
 * @endpoint POST /api/conversations
 */
export interface CreateConversationFromMessageCommand {
  content: string;
  model: string;
}

/**
 * Command to send a subsequent message in an existing conversation
 * @endpoint POST /api/conversations/{id}/messages
 */
export interface SendMessageCommand {
  content: string;
  model: string;
}

/**
 * Branch type for creating a new conversation from an existing message
 */
export type BranchType = "full" | "summary";

/**
 * Command to create a branch from an existing message
 * @endpoint POST /api/messages/{id}/branch
 */
export interface CreateBranchCommand {
  type: BranchType;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Generic success response
 * Used by multiple endpoints that return a simple success/message response
 */
export interface SuccessResponseDto {
  success: boolean;
  message: string;
}

/**
 * Error field detail for validation errors
 */
export interface ErrorFieldDto {
  field: string;
  message: string;
}

/**
 * Standard error response
 * Used by all endpoints to return consistent error messages
 */
export interface ErrorResponseDto {
  statusCode: number;
  message: string;
  errors?: ErrorFieldDto[];
}

/**
 * Response indicating whether an API key exists for the user
 * @endpoint GET /api/api-key
 */
export interface ApiKeyExistsDto {
  exists: boolean;
}

/**
 * Conversation DTO for API responses
 * Excludes user_id (internal) and branch_count (internal)
 */
export type ConversationDto = Pick<Conversation, "id" | "title" | "parent_conversation_id" | "created_at">;

/**
 * Message DTO for API responses
 * Excludes conversation_id as it's typically known from context
 */
export type MessageDto = Omit<Message, "conversation_id">;

/**
 * Response containing a conversation and its initial messages
 * @endpoint POST /api/conversations
 */
export interface ConversationWithMessagesDto {
  conversation: ConversationDto;
  messages: MessageDto[];
}

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationDto {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Paginated list of conversations
 * @endpoint GET /api/conversations
 */
export interface PaginatedConversationsDto {
  data: ConversationDto[];
  pagination: PaginationDto;
}

/**
 * Paginated list of messages
 * @endpoint GET /api/conversations/{id}/messages
 */
export interface PaginatedMessagesDto {
  data: MessageDto[];
  pagination: PaginationDto;
}

/**
 * Model DTO for API responses
 * Contains basic information about an available AI model
 * @endpoint GET /api/models
 */
export interface ModelDto {
  id: string;
  name: string;
}

/**
 * Response containing list of available models
 * @endpoint GET /api/models
 */
export interface ModelsListDto {
  data: ModelDto[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Query parameters for pagination
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
