import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const supabase = adminClient();

  let { data, error } = await supabase.rpc("memory_recent_per_tag", {
    since: since ? new Date(since).toISOString() : null,
  });

  if (error) {
    console.error("RPC error:", error);
    return bad(error.message, 500);
  }

  return ok(data ?? []);
});
