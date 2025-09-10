import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);

  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");
  if (!tag) return bad("tag is required");

  const supabase = adminClient();

  console.log("Counting memories with tag:", tag);

  const { count, error } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .filter("tags_flat", "ilike", `%${tag}%`);

  if (error) {
    console.error("Count error:", error);
    return bad(error.message, 500);
  }

  return ok({ tag, count: count ?? 0 });
});
