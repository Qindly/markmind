-- +up
CREATE TABLE IF NOT EXISTS folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders (user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id_created_at ON folders (user_id, created_at, id);

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    folder_id BIGINT NULL,
    title VARCHAR(120) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_updated_at ON documents (user_id, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_folder_id ON documents (user_id, folder_id, updated_at DESC, id DESC);

-- +down
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS folders;
