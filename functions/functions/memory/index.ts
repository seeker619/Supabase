import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient, ok, bad, parseTagFilter } from "../_shared/mod.ts";
serve(async (req)=>{
  const supabase = adminClient();
  if (req.method === "POST") {
    const body = await req.json().catch(()=>null);
    if (!body?.memory_content || !Array.isArray(body.tags) || body.tags.length === 0) {
      return bad("memory_content and tags[] are required");
    }
    const { data, error } = await supabase.from("memories").insert({
      memory_content: body.memory_content,
      tags: body.tags,
      protocol: body.protocol ?? null
    }).select().single();
    if (error) return bad(error.message, 500);
    return ok(data);
  }
  if (req.method === "GET") {
    const url = new URL(req.url);
    const memory_content = url.searchParams.get("memory_content") ?? undefined;
    const tags = url.searchParams.get("tags") ?? undefined;
    const protocol = url.searchParams.get("protocol") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    let q = supabase.from("memories").select("*").order("id", {
      ascending: false
    }) // bigint identity
    .range(offset, offset + limit - 1);
    if (protocol) q = q.eq("protocol", protocol);
    if (memory_content) q = q.ilike("memory_content", `%${memory_content}%`);
    const tf = parseTagFilter(tags);
    if (tf) {
      if (tf.mode === "cs") {
        // contains ALL tags
        q = q.contains("tags", tf.list);
      } else {
        // overlaps ANY: OR across tags.cs
        const ors = tf.list.map((t)=>`tags.cs.{${t}}`).join(",");
        q = q.or(ors);
      }
    }
    const { data, error } = await q;
    if (error) return bad(error.message, 500);
    return ok(data ?? []);
  }
  return bad("Method not allowed", 405);
});
