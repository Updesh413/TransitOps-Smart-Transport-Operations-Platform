import { createClient } from "@supabase/supabase-js";

// Use placeholder credentials during build time to prevent compilation pre-rendering crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  "placeholder-anon-key-to-allow-build-prerendering-succeed";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConnectionInfo = {
  isConnected: 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || ""
};
