
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = "https://fofwiiaunvixzjfxiqak.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZndpaWF1bnZpeHpqZnhpcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzMxNTgsImV4cCI6MjA2MzQ0OTE1OH0.RcBLjltBYJE3EJiievN1kiQIcBHTGM6gsRocDATR3Jc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to ensure profile role is correctly typed
export function ensureValidRole(role: string): "admin" | "student" {
  return role === "admin" ? "admin" : "student";
}
