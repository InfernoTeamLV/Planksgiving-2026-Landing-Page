import { createClient } from "@supabase/supabase-js";

// Only browser-safe publishable keys belong here. Never use a service-role key.
// Lazily initialized: the marketing page works without a database connection.
let client: ReturnType<typeof createClient> | undefined;

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before using Supabase features."
    );
  }
  return (client ??= createClient(url, key));
}
