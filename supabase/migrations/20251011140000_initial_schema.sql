-- Migration: Initial Schema for switch-ai MVP
-- Purpose: Create the core database structure including api_keys, conversations, and messages tables
-- Affected: Custom types, tables, indexes, and RLS policies
-- Special considerations: Encryption for API keys, conversation branching support, strict user data isolation

-- ============================================================================
-- Custom Types
-- ============================================================================

-- Create enum for message roles
create type message_role as enum ('user', 'assistant', 'system');

-- ============================================================================
-- Tables
-- ============================================================================

-- Table: api_keys
-- Purpose: Stores encrypted OpenRouter API keys belonging to users
-- Security: One-to-one relationship with auth.users, cascading delete on user removal
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  encrypted_key text not null,
  created_at timestamptz not null default now()
);

-- Table: conversations
-- Purpose: Stores metadata for each conversation, including title and branching relationships
-- Features: Self-referencing for conversation branches, branch counter for efficient naming
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_conversation_id uuid references conversations(id) on delete set null,
  title text,
  branch_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Table: messages
-- Purpose: Stores individual messages within conversations with token usage tracking
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role message_role not null,
  content text not null,
  model_name text,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index: idx_conversations_user_id
-- Purpose: Accelerate queries filtering conversations for the logged-in user
-- Common query pattern: SELECT * FROM conversations WHERE user_id = $1
create index idx_conversations_user_id on conversations(user_id);

-- Index: idx_messages_conversation_id_created_at
-- Purpose: Optimize fetching full, sorted message history for a single conversation
-- Common query pattern: SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC
create index idx_messages_conversation_id_created_at on messages(conversation_id, created_at desc);

-- Index: idx_conversations_parent_conversation_id
-- Purpose: Optimize foreign key operations and queries filtering by parent conversation
-- Common query pattern: SELECT * FROM conversations WHERE parent_conversation_id = $1
create index idx_conversations_parent_conversation_id on conversations(parent_conversation_id);

-- Index: idx_messages_conversation_id
-- Purpose: Optimize foreign key operations on conversation_id
-- Common query pattern: Foreign key constraint checks and joins
create index idx_messages_conversation_id on messages(conversation_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables to ensure strict data isolation between users
alter table api_keys enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- ----------------------------------------------------------------------------
-- RLS Policies: api_keys
-- Purpose: Users can only access their own API key
-- ----------------------------------------------------------------------------

-- Policy: api_keys_select_own
-- Allows authenticated users to view only their own API key
create policy api_keys_select_own on api_keys
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: api_keys_insert_own
-- Allows authenticated users to create their own API key
create policy api_keys_insert_own on api_keys
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: api_keys_update_own
-- Allows authenticated users to update only their own API key
create policy api_keys_update_own on api_keys
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: api_keys_delete_own
-- Allows authenticated users to delete only their own API key
create policy api_keys_delete_own on api_keys
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policies: conversations
-- Purpose: Users can only access their own conversations
-- ----------------------------------------------------------------------------

-- Policy: conversations_select_own
-- Allows authenticated users to view only their own conversations
create policy conversations_select_own on conversations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: conversations_insert_own
-- Allows authenticated users to create their own conversations
create policy conversations_insert_own on conversations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: conversations_update_own
-- Allows authenticated users to update only their own conversations
create policy conversations_update_own on conversations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: conversations_delete_own
-- Allows authenticated users to delete only their own conversations
-- Note: Deleting a parent conversation sets parent_conversation_id to NULL in child branches
create policy conversations_delete_own on conversations
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- RLS Policies: messages
-- Purpose: Users can only access messages in conversations they own
-- ----------------------------------------------------------------------------

-- Policy: messages_select_own
-- Allows authenticated users to view messages only in their own conversations
create policy messages_select_own on messages
  for select
  to authenticated
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
    )
  );

-- Policy: messages_insert_own
-- Allows authenticated users to create messages only in their own conversations
create policy messages_insert_own on messages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
    )
  );

-- Policy: messages_update_own
-- Allows authenticated users to update messages only in their own conversations
create policy messages_update_own on messages
  for update
  to authenticated
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
    )
  );

-- Policy: messages_delete_own
-- Allows authenticated users to delete messages only in their own conversations
create policy messages_delete_own on messages
  for delete
  to authenticated
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
    )
  );
