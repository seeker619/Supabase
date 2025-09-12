import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";
serve(async (req)=>{
  if (req.method !== "GET") return bad("Method not allowed", 405);
  const url = new URL(req.url);
  const raw = url.searchParams.get("tags");
  const mode = url.searchParams.get("mode") || "or";
  if (!raw) return bad("tags is required, comma-separated");
  const list = raw.split(",").map((s)=>s.trim()).filter(Boolean);
  if (list.length === 0) return bad("no tags provided");
  const supabase = adminClient();
  let query = supabase.from("memories").select("*").order("id", {
    ascending: false
  }).limit(200);
  if (mode === "and") {
    for (const t of list)query = query.ilike("tags_flat", `%${t}%`);
  } else {
    const ors = list.map((t)=>`tags_flat.ilike.%${t}%`).join(",");
    query = query.or(ors);
  }
  const { data, error } = await query;
  if (error) return bad(error.message, 500);
  return ok(data ?? []);
});
