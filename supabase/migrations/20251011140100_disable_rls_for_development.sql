-- Migration: Disable RLS for Development
-- Purpose: Temporarily disable Row Level Security for easier development and testing
-- Affected: api_keys, conversations, messages tables
-- Special considerations: THIS SHOULD ONLY BE USED IN DEVELOPMENT ENVIRONMENTS
-- WARNING: Never apply this migration to production databases

-- ============================================================================
-- Disable Row Level Security
-- ============================================================================

-- Disable RLS on api_keys table
-- This allows unrestricted access to all API keys regardless of user
alter table api_keys disable row level security;

-- Disable RLS on conversations table
-- This allows unrestricted access to all conversations regardless of user
alter table conversations disable row level security;

-- Disable RLS on messages table
-- This allows unrestricted access to all messages regardless of user
alter table messages disable row level security;

-- ============================================================================
-- Note: To re-enable RLS for production
-- ============================================================================
-- Create a new migration file with the following commands:
-- alter table api_keys enable row level security;
-- alter table conversations enable row level security;
-- alter table messages enable row level security;

