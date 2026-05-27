const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role bypasses RLS — only use server-side
  {
    auth: { persistSession: false }
  }
);

module.exports = supabase;