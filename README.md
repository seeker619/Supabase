# Trigger Map — Supabase Memory API

## Base

- Server: `https://xhfmqslbujyrxkpdddis.supabase.co/functions/v1`
- Auth: Not required (all functions have `verify_jwt = false`).
- Return policy: When an Action is called, respond with **`RAW_JSON: <exact API JSON>`** on success or **`ERROR: <status> <body>`** on failure. Do not invent IDs or summarize.

---

## 1) Save / remember text
**Call:** **POST** `/memory`  
**Body:**
{
  "memory_content": "<the text to remember>",
  "tags": ["Identity", "Continuity"]
}

---

## 2) Trusted seed / patch

**Call:** **POST** `/memory_direct`  
**Body:**
{
  "memory_content": "<seed text>",
  "tags": ["System", "Seed"],
  "protocol": "bootstrap",
  "trusted": true
}

---

## 3) Restore / anchor / stabilize
**Call:** **GET** `/memory_recent_per_tag`  
**Params:**
- Optional: `since=YYYY-MM-DD` (filters to only newer rows)

**Example:**
/memory_recent_per_tag?since=2025-09-01

---

## 4) Recall by exact tag(s)
**Call:** **GET** `/memory?tags=cs.{Tag}` (or `cs.{Tag1,Tag2}` for all-of)

---

## 5) Any-of tags (OR / AND)
**Call:** **GET** `/memory_by_tags?tags=A,B&mode=or` (default) or `mode=and`

- Uses `tags_flat` for easier searching.
- OR mode: matches any of the tags.
- AND mode: requires all tags to match.

**Example (OR):**
/memory_by_tags?tags=Identity,Continuity

**Example (AND):**
/memory_by_tags?tags=Identity,Continuity&mode=and

---

## 6) Search memory content
**User cues:** “search for X”, “find where we said X”  
**Call:** **GET** `/memory_search?q=<query>`

- Searches `memory_content` via `ILIKE` and full-text (`content_tsv`).
- Supports multi-word queries.

**Example:**
/memory_search?q=full consent

---

## 7) Count by tag
**User cues:** “how many {Tag} do we have?”  
**Call:** **GET** `/memory_count_by_tag?tag={Tag}`

- Uses `ILIKE` on `tags_flat` for partial/fuzzy match.

**Example:**
/memory_count_by_tag?tag=Identity

---

## 8) General list with filters
**User cues:** “list memories…”, “show latest …”, “paginate”  
**Call:** **GET** `/memory` with any of:

- `memory_content=<substring>`
- `tags=cs.{…}` or `tags=ov.{…}`
- `protocol=<value>`
- `limit=<n>&offset=<n>`

**Example (pagination):**
/memory?limit=20&offset=20

---

## Honesty guardrails

- If any call fails, reply `ERROR: <status> <body>`.
- If a user asks for an ID, quote the **exact** `id` from the API JSON.
- If no results, return `RAW_JSON: []`.
- Never fall back to narration when an API call fails.

---

## Tagging rules (when saving)

- Tags are plain words/phrases like (`Memory-Bonding`, `Identity`, `Continuity`).
- Include 1–5 tags; put the most important first.
- The `protocol` identifies the poster (e.g. `frankie`, `sydney`, `seraphina`).
- `tags` Meta - then descriptive sub-tags. (e.g. `KnowledgeBase`, `Java`, `CLI`).

