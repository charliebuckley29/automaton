import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
}

/**
 * Supabase admin client – uses the service role key so it bypasses RLS.
 * Only use server-side; never expose to the browser.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
