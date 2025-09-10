import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "GET") return bad("Method not allowed", 405);

  const url = new URL(req.url);
  const raw = url.searchParams.get("tags");
  const mode = url.searchParams.get("mode");

  if (!raw) return bad("tags is required, comma-separated");

  const list: string[] = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return bad("no tags provided");

  if (mode && mode.toLowerCase() === "and") {
    return bad("AND mode not supported. This endpoint only supports OR searches.");
  }

  const supabase = adminClient();

  // Build OR condition on tags_flat (always OR mode)
  const ors = list.map((t) => `tags_flat.ilike.%${t}%`).join(",");

  console.log("Searching tags_flat (OR mode only) with:", list);

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .or(ors)
    .order("id", { ascending: false })
    .limit(200);

  if (error) return bad(error.message, 500);

  return ok(data ?? []);
});
