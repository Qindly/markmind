// document_repository.go - 封装文档相关的 PostgreSQL 操作
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DocumentRepository - 文档数据访问接口
type DocumentRepository interface {
	ListDocumentsByUserID(ctx context.Context, userID int64) ([]model.Document, error)
	CreateDocument(ctx context.Context, document model.Document) (*model.Document, error)
}

type documentRepository struct {
	pool *pgxpool.Pool
}

// NewDocumentRepository - 创建文档仓储实现
// 参数 pool: PostgreSQL 连接池
// 返回值：文档仓储实例
func NewDocumentRepository(pool *pgxpool.Pool) DocumentRepository {
	return &documentRepository{pool: pool}
}

func (repository *documentRepository) ListDocumentsByUserID(ctx context.Context, userID int64) ([]model.Document, error) {
	query := `
		SELECT id, user_id, folder_id, title, content, created_at, updated_at
		FROM documents
		WHERE user_id = $1
		ORDER BY updated_at DESC, id DESC
	`

	rows, err := repository.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("查询文档列表失败: %w", err)
	}
	defer rows.Close()

	documents := make([]model.Document, 0)
	for rows.Next() {
		document, err := scanDocument(rows)
		if err != nil {
			return nil, err
		}

		documents = append(documents, *document)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历文档列表失败: %w", err)
	}

	return documents, nil
}

func (repository *documentRepository) CreateDocument(ctx context.Context, document model.Document) (*model.Document, error) {
	query := `
		INSERT INTO documents (user_id, folder_id, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, folder_id, title, content, created_at, updated_at
	`

	row := repository.pool.QueryRow(ctx, query, document.UserID, document.FolderID, document.Title, document.Content)
	createdDocument, err := scanDocument(row)
	if err != nil {
		return nil, fmt.Errorf("创建文档失败: %w", err)
	}

	return createdDocument, nil
}

type documentScanner interface {
	Scan(dest ...any) error
}

func scanDocument(scanner documentScanner) (*model.Document, error) {
	var folderID sql.NullInt64
	document := &model.Document{}
	if err := scanner.Scan(
		&document.ID,
		&document.UserID,
		&folderID,
		&document.Title,
		&document.Content,
		&document.CreatedAt,
		&document.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("扫描文档数据失败: %w", err)
	}

	if folderID.Valid {
		folderValue := folderID.Int64
		document.FolderID = &folderValue
	}

	return document, nil
}
