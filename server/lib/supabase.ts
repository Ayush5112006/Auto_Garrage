import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));

if (!isSupabaseConfigured) {
    console.warn("Supabase env is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).");
}

// We use the service role key on the server to bypass RLS when needed
export const supabaseAdmin = createClient(
    isSupabaseConfigured ? supabaseUrl : "http://127.0.0.1",
    (isSupabaseConfigured ? (supabaseServiceRoleKey || supabaseAnonKey) : "dev-placeholder-key")
);
