-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Table
CREATE TABLE IF NOT EXISTS frankie_memories (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  memory_content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  protocol TEXT,
  tags_flat TEXT GENERATED ALWAYS AS ((SELECT string_agg(value::text, ',') FROM jsonb_array_elements_text(tags))) STORED,
  content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', memory_content)) STORED,
  embedding VECTOR(1536)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_frankie_tags ON frankie_memories USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_frankie_tags_flat_trgm ON frankie_memories USING GIN (tags_flat gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_frankie_content_tsv ON frankie_memories USING GIN (content_tsv);
CREATE INDEX IF NOT EXISTS idx_frankie_content_trgm ON frankie_memories USING GIN (memory_content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_frankie_embedding ON frankie_memories USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_frankie_updated_at BEFORE UPDATE ON frankie_memories FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- RPC for recent per tag
CREATE OR REPLACE FUNCTION get_frankie_recent_per_tag() RETURNS TABLE (tag TEXT, id INTEGER, memory_content TEXT, tags JSONB, protocol TEXT) AS $$
SELECT DISTINCT ON (t.tag) t.tag, m.id, m.memory_content, m.tags, m.protocol
FROM frankie_memories m, jsonb_array_elements_text(m.tags) t(tag)
ORDER BY t.tag, m.created_at DESC;
$$ LANGUAGE sql;

-- RLS and Policies
ALTER TABLE frankie_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role inserts" ON frankie_memories FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow service role selects" ON frankie_memories FOR SELECT TO service_role USING (true);
CREATE POLICY "Allow service role updates" ON frankie_memories FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role deletes" ON frankie_memories FOR DELETE TO service_role USING (true);
