import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad } from "../_shared/mod.ts";
serve(async (req)=>{
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch  {
      return bad("Invalid JSON body");
    }
    if (!body?.memory_content || !Array.isArray(body.tags) || body.tags.length === 0) {
      return bad("memory_content and tags[] are required");
    }
    const supabase = adminClient();
    const { data, error } = await supabase.from("memories").insert({
      memory_content: body.memory_content,
      tags: body.tags,
      protocol: body.protocol ?? "note"
    }).select("id").single();
    if (error) return bad(error.message, 500);
    return ok({
      status: "ok",
      id: data.id
    });
  }
  if (req.method === "GET") {
    const url = new URL(req.url);
    const supabase = adminClient();
    let query = supabase.from("memories").select("*").order("id", {
      ascending: false
    });
    if (url.searchParams.get("memory_content")) query = query.ilike("memory_content", `%${url.searchParams.get("memory_content")}%`);
    if (url.searchParams.get("tags")) query = query.filter("tags", "cs", `{${url.searchParams.get("tags")}}`);
    if (url.searchParams.get("protocol")) query = query.eq("protocol", url.searchParams.get("protocol"));
    if (url.searchParams.get("limit")) query = query.limit(Number(url.searchParams.get("limit")));
    if (url.searchParams.get("offset")) query = query.range(Number(url.searchParams.get("offset")), Number(url.searchParams.get("offset")) + Number(url.searchParams.get("limit")) - 1);
    const { data, error } = await query;
    if (error) return bad(error.message, 500);
    return ok(data ?? []);
  }
  return bad("Method not allowed", 405);
});
