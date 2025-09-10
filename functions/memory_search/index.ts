import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q) return bad("Missing required query parameter: q");

  const supabase = adminClient();

  console.log("Searching memories with query:", q);

  const { data, error } = await supabase
    .rpc("memory_search", { q })
    .select();

  if (error) {
    console.error("Search error:", error);
    return bad(error.message, 500);
  }

  return ok(data ?? []);
});
