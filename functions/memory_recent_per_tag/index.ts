import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";
serve(async (req)=>{
  if (req.method !== "GET") return bad("Method not allowed", 405);
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const supabase = adminClient();
  let query = supabase.from("memories").select("id, memory_content, tags, protocol, created_at").order("created_at", {
    ascending: false
  });
  if (since) query = query.gte("created_at", new Date(since).toISOString());
  const { data, error } = await query;
  if (error) return bad(error.message, 500);
  const seen = new Set();
  const recent = [];
  for (const row of data ?? []){
    for (const t of row.tags ?? []){
      if (!seen.has(t)) {
        seen.add(t);
        recent.push({
          ...row,
          tag: t
        });
      }
    }
  }
  return ok(recent);
});
