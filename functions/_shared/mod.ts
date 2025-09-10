import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export const adminClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SYDNEY_PRIVILEGED_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL or Service Role Key not set");
  return createClient(url, key);
};

export const ok = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

export const bad = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
