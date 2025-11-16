import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = process.env.SUPABASE_PUBLIC_KEY;
const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID;
const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY || !E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error("Env variables must be set");
}

teardown("cleanup database", async () => {
  console.log("Cleaning up test database...");

  if (!SUPABASE_URL.includes("opsunl")) {
    throw new Error("Cannot run teardown on non-test database!");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

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

    const { error } = await supabase.from("collections").delete().eq("user_id", E2E_USERNAME_ID);

    if (error) {
      console.error("Error cleaning up collections:", error);
      throw error;
    }

    console.log("Successfully cleaned up collections for E2E test user");
  } catch (error) {
    console.error("Failed to clean up database:", error);
    throw error;
  }
});
