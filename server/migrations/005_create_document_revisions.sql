-- +up
CREATE TABLE IF NOT EXISTS document_revisions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
    revision_number BIGINT NOT NULL,
    snapshot_content TEXT NOT NULL DEFAULT '',
    content_size INTEGER NOT NULL DEFAULT 0,
    operation VARCHAR(16) NOT NULL,
    source_revision_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_revisions_document_id_revision_number
    ON document_revisions (document_id, revision_number);

CREATE INDEX IF NOT EXISTS idx_document_revisions_document_id_revision_number_desc
    ON document_revisions (document_id, revision_number DESC, id DESC);

INSERT INTO document_revisions (
    document_id,
    revision_number,
    snapshot_content,
    content_size,
    operation,
    source_revision_id,
    created_at
)
SELECT
    documents.id,
    1,
    documents.content,
    char_length(documents.content),
    'seed',
    NULL,
    documents.updated_at
FROM documents
WHERE NOT EXISTS (
    SELECT 1
    FROM document_revisions
    WHERE document_revisions.document_id = documents.id
);

-- +down
DROP TABLE IF EXISTS document_revisions;
