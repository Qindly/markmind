-- +up
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_documents_title_trgm
    ON documents
    USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_content_trgm
    ON documents
    USING GIN (content gin_trgm_ops);

-- +down
DROP INDEX IF EXISTS idx_documents_content_trgm;
DROP INDEX IF EXISTS idx_documents_title_trgm;
