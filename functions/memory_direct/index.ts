import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const body = await req.json().catch(() => null);
  if (!body?.memory_content || !Array.isArray(body.tags) || body.tags.length === 0) {
    console.error("Bad Request: Missing memory_content or tags", body);
    return bad("memory_content and tags[] are required");
  }

  const supabase = adminClient();

  console.log("Inserting trusted memory:", {
    memory_content: body.memory_content,
    tags: body.tags,
    protocol: body.protocol ?? "trusted",
  });

  const { data, error } = await supabase.from("memories").insert({
    memory_content: body.memory_content,
    tags: body.tags,
    protocol: body.protocol ?? "trusted",
  }).select("id").single();

  console.log("Insert result:", data);
  if (error) {
    console.error("Insert error:", error);
    return bad(error.message, 500);
  }

  return ok({
    status: "ok",
    id: data.id,
  });
});
