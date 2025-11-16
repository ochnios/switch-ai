/* eslint-disable no-console */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID;
const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error("Env variables must be set");
}

teardown("cleanup database", async () => {
  console.log("Cleaning up test database...");

  if (!SUPABASE_URL.includes("opsunl")) {
    throw new Error("Cannot run teardown on non-test database!");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Sign in with test user credentials to avoid issues with RLS
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: E2E_USERNAME,
      password: E2E_PASSWORD,
    });

    if (signInError) {
      console.error("Error signing in:", signInError);
      throw signInError;
    }

    // Fetch conversation IDs for the test user
    const { data: conversations, error: fetchError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", E2E_USERNAME_ID);

    if (fetchError) {
      console.error("Error fetching conversations:", fetchError);
      throw fetchError;
    }

    // Delete messages for these conversations (if any exist)
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      const { error: messagesError } = await supabase.from("messages").delete().in("conversation_id", conversationIds);

      if (messagesError) {
        console.error("Error cleaning up messages:", messagesError);
        throw messagesError;
      }
    }

    // Delete conversations (messages will cascade, but we already deleted them explicitly)
    const { error: conversationsError } = await supabase.from("conversations").delete().eq("user_id", E2E_USERNAME_ID);

    if (conversationsError) {
      console.error("Error cleaning up conversations:", conversationsError);
      throw conversationsError;
    }

    // Delete api_keys
    const { error: apiKeysError } = await supabase.from("api_keys").delete().eq("user_id", E2E_USERNAME_ID);

    if (apiKeysError) {
      console.error("Error cleaning up api_keys:", apiKeysError);
      throw apiKeysError;
    }

    console.log("Successfully cleaned up test data for E2E test user");
  } catch (error) {
    console.error("Failed to clean up database:", error);
    throw error;
  }
});
