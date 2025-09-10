import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);

  const url = new URL(req.url);
  const raw = url.searchParams.get("tags");
  if (!raw) return bad("tags is required, comma-separated");

  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return bad("no tags provided");

  const supabase = adminClient();

  // Build OR condition on tags_flat
  const ors = list.map((t) => `tags_flat.ilike.%${t}%`).join(",");

  console.log("Searching tags_flat with:", list);

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .or(ors)
    .order("id", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Search error:", error);
    return bad(error.message, 500);
  }

  console.log("Search returned", data?.length ?? 0, "results");

  return ok(data ?? []);
});
