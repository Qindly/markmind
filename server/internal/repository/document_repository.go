// document_repository.go - 封装文档相关的 PostgreSQL 操作
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DocumentRepository - 文档数据访问接口。
type DocumentRepository interface {
	ListDocumentsByUserID(ctx context.Context, userID int64) ([]model.Document, error)
	SearchDocumentsByKeyword(ctx context.Context, userID int64, folderID *int64, keyword string, searchAll bool) ([]model.Document, error)
	CreateDocument(ctx context.Context, document model.Document) (*model.Document, error)
	CountDocumentsByFolderIDAndUserID(ctx context.Context, folderID int64, userID int64) (int64, error)
	FindDocumentByIDAndUserID(ctx context.Context, documentID int64, userID int64) (*model.Document, error)
	UpdateDocumentMetaByIDAndUserID(ctx context.Context, documentID int64, userID int64, title *string, folderIDSet bool, folderID *int64) (*model.Document, error)
	UpdateDocumentContentByIDAndUserID(ctx context.Context, documentID int64, userID int64, content string) (*model.Document, error)
	DeleteDocumentByIDAndUserID(ctx context.Context, documentID int64, userID int64) error
}

type documentRepository struct {
	pool *pgxpool.Pool
}

// NewDocumentRepository - 创建文档仓储实现。
// 参数 pool: PostgreSQL 连接池。
// 返回值：文档仓储实例。
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

func (repository *documentRepository) SearchDocumentsByKeyword(
	ctx context.Context,
	userID int64,
	folderID *int64,
	keyword string,
	searchAll bool,
) ([]model.Document, error) {
	queryArgs := []any{userID, "%" + keyword + "%"}
	query := `
		SELECT id, user_id, folder_id, title, content, created_at, updated_at
		FROM documents
		WHERE user_id = $1
			AND (title ILIKE $2 OR content ILIKE $2)
		ORDER BY updated_at DESC, id DESC
	`

	if !searchAll {
		query = `
			SELECT id, user_id, folder_id, title, content, created_at, updated_at
			FROM documents
			WHERE user_id = $1 AND folder_id IS NULL
				AND (title ILIKE $2 OR content ILIKE $2)
			ORDER BY updated_at DESC, id DESC
		`
	}

	if !searchAll && folderID != nil {
		query = `
			SELECT id, user_id, folder_id, title, content, created_at, updated_at
			FROM documents
			WHERE user_id = $1 AND folder_id = $2
				AND (title ILIKE $3 OR content ILIKE $3)
			ORDER BY updated_at DESC, id DESC
		`
		queryArgs = []any{userID, *folderID, "%" + keyword + "%"}
	}

	rows, err := repository.pool.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("搜索文档失败: %w", err)
	}
	defer rows.Close()

	documents := make([]model.Document, 0)
	for rows.Next() {
		document, scanErr := scanDocument(rows)
		if scanErr != nil {
			return nil, scanErr
		}

		documents = append(documents, *document)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历搜索结果失败: %w", err)
	}

	return documents, nil
}

func (repository *documentRepository) CountDocumentsByFolderIDAndUserID(ctx context.Context, folderID int64, userID int64) (int64, error) {
	query := `
		SELECT COUNT(1)
		FROM documents
		WHERE folder_id = $1 AND user_id = $2
	`

	var count int64
	if err := repository.pool.QueryRow(ctx, query, folderID, userID).Scan(&count); err != nil {
		return 0, fmt.Errorf("统计文件夹文档数量失败: %w", err)
	}

	return count, nil
}

func (repository *documentRepository) FindDocumentByIDAndUserID(ctx context.Context, documentID int64, userID int64) (*model.Document, error) {
	query := `
		SELECT id, user_id, folder_id, title, content, created_at, updated_at
		FROM documents
		WHERE id = $1 AND user_id = $2
		LIMIT 1
	`

	document, err := scanDocument(repository.pool.QueryRow(ctx, query, documentID, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentNotFound
		}

		return nil, fmt.Errorf("查询文档失败: %w", err)
	}

	return document, nil
}

func (repository *documentRepository) UpdateDocumentMetaByIDAndUserID(
	ctx context.Context,
	documentID int64,
	userID int64,
	title *string,
	folderIDSet bool,
	folderID *int64,
) (*model.Document, error) {
	setClauses := []string{"updated_at = NOW()"}
	queryArgs := []any{documentID, userID}
	nextArgIndex := 3

	if title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", nextArgIndex))
		queryArgs = append(queryArgs, *title)
		nextArgIndex++
	}

	if folderIDSet {
		setClauses = append(setClauses, fmt.Sprintf("folder_id = $%d", nextArgIndex))

		var folderValue any
		if folderID != nil {
			folderValue = *folderID
		}

		queryArgs = append(queryArgs, folderValue)
	}

	query := fmt.Sprintf(`
		UPDATE documents
		SET %s
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, folder_id, title, content, created_at, updated_at
	`, strings.Join(setClauses, ", "))

	updatedDocument, err := scanDocument(repository.pool.QueryRow(ctx, query, queryArgs...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentNotFound
		}

		return nil, fmt.Errorf("更新文档元信息失败: %w", err)
	}

	return updatedDocument, nil
}

func (repository *documentRepository) UpdateDocumentContentByIDAndUserID(ctx context.Context, documentID int64, userID int64, content string) (*model.Document, error) {
	query := `
		UPDATE documents
		SET content = $3, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, folder_id, title, content, created_at, updated_at
	`

	updatedDocument, err := scanDocument(repository.pool.QueryRow(ctx, query, documentID, userID, content))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentNotFound
		}

		return nil, fmt.Errorf("更新文档内容失败: %w", err)
	}

	return updatedDocument, nil
}

func (repository *documentRepository) DeleteDocumentByIDAndUserID(ctx context.Context, documentID int64, userID int64) error {
	query := `
		DELETE FROM documents
		WHERE id = $1 AND user_id = $2
	`

	result, err := repository.pool.Exec(ctx, query, documentID, userID)
	if err != nil {
		return fmt.Errorf("删除文档失败: %w", err)
	}

	if result.RowsAffected() == 0 {
		return appconst.ErrDocumentNotFound
	}

	return nil
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
