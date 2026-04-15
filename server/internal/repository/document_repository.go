// document_repository.go - 封装文档与历史版本相关的 PostgreSQL 操作
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const defaultDocumentRevisionQueryLimit = 50

// DocumentSummary - 不含 content 的文档摘要，用于列表场景。
type DocumentSummary struct {
	ID        int64
	UserID    int64
	FolderID  *int64
	Title     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// DocumentRepository - 文档数据访问接口。
type DocumentRepository interface {
	ListDocumentSummariesByUserID(ctx context.Context, userID int64) ([]DocumentSummary, error)
	ListDocumentsByUserID(ctx context.Context, userID int64) ([]model.Document, error)
	SearchDocumentsByKeyword(ctx context.Context, userID int64, folderID *int64, keyword string, searchAll bool) ([]model.Document, error)
	CreateDocument(ctx context.Context, document model.Document) (*model.Document, error)
	CountDocumentsByFolderIDAndUserID(ctx context.Context, folderID int64, userID int64) (int64, error)
	FindDocumentByIDAndUserID(ctx context.Context, documentID int64, userID int64) (*model.Document, error)
	UpdateDocumentMetaByIDAndUserID(ctx context.Context, documentID int64, userID int64, title *string, folderIDSet bool, folderID *int64) (*model.Document, error)
	UpdateDocumentContentByIDAndUserID(ctx context.Context, documentID int64, userID int64, content string, createRevision bool) (*model.Document, bool, error)
	ListDocumentRevisionsByDocumentIDAndUserID(ctx context.Context, documentID int64, userID int64, limit int) ([]model.DocumentRevision, error)
	CurrentDocumentContentHasRevisionByDocumentIDAndUserID(ctx context.Context, documentID int64, userID int64) (bool, error)
	FindDocumentRevisionByIDAndDocumentIDAndUserID(ctx context.Context, revisionID int64, documentID int64, userID int64) (*model.DocumentRevision, error)
	RollbackDocumentToRevisionByIDAndUserID(ctx context.Context, documentID int64, userID int64, targetRevisionID int64) (*model.Document, *model.DocumentRevision, bool, error)
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

func (repository *documentRepository) ListDocumentSummariesByUserID(ctx context.Context, userID int64) ([]DocumentSummary, error) {
	query := `
		SELECT id, user_id, folder_id, title, created_at, updated_at
		FROM documents
		WHERE user_id = $1
		ORDER BY updated_at DESC, id DESC
	`

	rows, err := repository.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("查询文档列表失败: %w", err)
	}
	defer rows.Close()

	summaries := make([]DocumentSummary, 0)
	for rows.Next() {
		var folderID sql.NullInt64
		var s DocumentSummary
		if err := rows.Scan(&s.ID, &s.UserID, &folderID, &s.Title, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("扫描文档摘要数据失败: %w", err)
		}
		if folderID.Valid {
			v := folderID.Int64
			s.FolderID = &v
		}
		summaries = append(summaries, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历文档列表失败: %w", err)
	}

	return summaries, nil
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
	tx, err := repository.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("开启创建文档事务失败: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `
		INSERT INTO documents (user_id, folder_id, title, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, folder_id, title, content, created_at, updated_at
	`

	createdDocument, err := scanDocument(tx.QueryRow(ctx, query, document.UserID, document.FolderID, document.Title, document.Content))
	if err != nil {
		return nil, fmt.Errorf("创建文档失败: %w", err)
	}

	if _, err := repository.insertDocumentRevisionTx(
		ctx,
		tx,
		createdDocument.ID,
		1,
		createdDocument.Content,
		model.DocumentRevisionOperationCreate,
		nil,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("提交创建文档事务失败: %w", err)
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
	searchPattern := "%" + keyword + "%"
	queryArgs := []any{userID, searchPattern}
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
		queryArgs = []any{userID, *folderID, searchPattern}
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

func (repository *documentRepository) UpdateDocumentContentByIDAndUserID(
	ctx context.Context,
	documentID int64,
	userID int64,
	content string,
	createRevision bool,
) (*model.Document, bool, error) {
	tx, err := repository.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, false, fmt.Errorf("开启保存文档事务失败: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	currentDocument, err := repository.findDocumentByIDAndUserIDForUpdateTx(ctx, tx, documentID, userID)
	if err != nil {
		return nil, false, err
	}

	updatedDocument := currentDocument
	revisionSaved := false

	if currentDocument.Content != content {
		updatedDocument, err = scanDocument(tx.QueryRow(
			ctx,
			`
				UPDATE documents
				SET content = $3, updated_at = NOW()
				WHERE id = $1 AND user_id = $2
				RETURNING id, user_id, folder_id, title, content, created_at, updated_at
			`,
			documentID,
			userID,
			content,
		))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, false, appconst.ErrDocumentNotFound
			}

			return nil, false, fmt.Errorf("更新文档内容失败: %w", err)
		}
	}

	if createRevision {
		revisionSaved, err = repository.insertManualDocumentRevisionIfNeededTx(ctx, tx, documentID, updatedDocument.Content)
		if err != nil {
			return nil, false, err
		}
	}

	if currentDocument.Content == content && !revisionSaved {
		return currentDocument, false, nil
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, false, fmt.Errorf("提交保存文档事务失败: %w", err)
	}

	return updatedDocument, revisionSaved, nil
}

func (repository *documentRepository) ListDocumentRevisionsByDocumentIDAndUserID(
	ctx context.Context,
	documentID int64,
	userID int64,
	limit int,
) ([]model.DocumentRevision, error) {
	if limit <= 0 {
		limit = defaultDocumentRevisionQueryLimit
	}

	query := `
		SELECT
			document_revisions.id,
			document_revisions.document_id,
			document_revisions.revision_number,
			document_revisions.snapshot_content,
			document_revisions.content_size,
			document_revisions.operation,
			document_revisions.source_revision_id,
			document_revisions.created_at
		FROM document_revisions
		INNER JOIN documents ON documents.id = document_revisions.document_id
		WHERE document_revisions.document_id = $1 AND documents.user_id = $2
		ORDER BY document_revisions.revision_number DESC, document_revisions.id DESC
		LIMIT $3
	`

	rows, err := repository.pool.Query(ctx, query, documentID, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("查询文档历史版本失败: %w", err)
	}
	defer rows.Close()

	revisions := make([]model.DocumentRevision, 0)
	for rows.Next() {
		revision, err := scanDocumentRevision(rows)
		if err != nil {
			return nil, err
		}

		revisions = append(revisions, *revision)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历文档历史版本失败: %w", err)
	}

	return revisions, nil
}

func (repository *documentRepository) CurrentDocumentContentHasRevisionByDocumentIDAndUserID(
	ctx context.Context,
	documentID int64,
	userID int64,
) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM document_revisions
			INNER JOIN documents ON documents.id = document_revisions.document_id
			WHERE documents.id = $1
				AND documents.user_id = $2
				AND document_revisions.snapshot_content = documents.content
		)
	`

	var exists bool
	if err := repository.pool.QueryRow(ctx, query, documentID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("查询当前文档内容是否已进入历史版本失败: %w", err)
	}

	return exists, nil
}

func (repository *documentRepository) FindDocumentRevisionByIDAndDocumentIDAndUserID(
	ctx context.Context,
	revisionID int64,
	documentID int64,
	userID int64,
) (*model.DocumentRevision, error) {
	query := `
		SELECT
			document_revisions.id,
			document_revisions.document_id,
			document_revisions.revision_number,
			document_revisions.snapshot_content,
			document_revisions.content_size,
			document_revisions.operation,
			document_revisions.source_revision_id,
			document_revisions.created_at
		FROM document_revisions
		INNER JOIN documents ON documents.id = document_revisions.document_id
		WHERE document_revisions.id = $1
			AND document_revisions.document_id = $2
			AND documents.user_id = $3
		LIMIT 1
	`

	revision, err := scanDocumentRevision(repository.pool.QueryRow(ctx, query, revisionID, documentID, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentRevisionNotFound
		}

		return nil, fmt.Errorf("查询文档历史版本失败: %w", err)
	}

	return revision, nil
}

func (repository *documentRepository) RollbackDocumentToRevisionByIDAndUserID(
	ctx context.Context,
	documentID int64,
	userID int64,
	targetRevisionID int64,
) (*model.Document, *model.DocumentRevision, bool, error) {
	tx, err := repository.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, nil, false, fmt.Errorf("开启回滚事务失败: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	currentDocument, err := repository.findDocumentByIDAndUserIDForUpdateTx(ctx, tx, documentID, userID)
	if err != nil {
		return nil, nil, false, err
	}

	targetRevision, err := repository.findDocumentRevisionByIDTx(ctx, tx, targetRevisionID, documentID)
	if err != nil {
		return nil, nil, false, err
	}

	latestRevision, err := repository.findLatestDocumentRevisionByDocumentIDTx(ctx, tx, documentID)
	if err != nil {
		return nil, nil, false, err
	}

	if currentDocument.Content == targetRevision.SnapshotContent {
		return currentDocument, latestRevision, false, nil
	}

	updatedDocument, err := scanDocument(tx.QueryRow(
		ctx,
		`
			UPDATE documents
			SET content = $2, updated_at = NOW()
			WHERE id = $1
			RETURNING id, user_id, folder_id, title, content, created_at, updated_at
		`,
		documentID,
		targetRevision.SnapshotContent,
	))
	if err != nil {
		return nil, nil, false, fmt.Errorf("回滚文档内容失败: %w", err)
	}

	nextRevisionNumber, err := repository.findNextDocumentRevisionNumberTx(ctx, tx, documentID)
	if err != nil {
		return nil, nil, false, err
	}

	rollbackRevision, err := repository.insertDocumentRevisionTx(
		ctx,
		tx,
		documentID,
		nextRevisionNumber,
		targetRevision.SnapshotContent,
		model.DocumentRevisionOperationRollback,
		&targetRevision.ID,
	)
	if err != nil {
		return nil, nil, false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, false, fmt.Errorf("提交回滚事务失败: %w", err)
	}

	return updatedDocument, rollbackRevision, true, nil
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

func (repository *documentRepository) findDocumentByIDAndUserIDForUpdateTx(
	ctx context.Context,
	tx pgx.Tx,
	documentID int64,
	userID int64,
) (*model.Document, error) {
	query := `
		SELECT id, user_id, folder_id, title, content, created_at, updated_at
		FROM documents
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
	`

	document, err := scanDocument(tx.QueryRow(ctx, query, documentID, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentNotFound
		}

		return nil, fmt.Errorf("锁定文档失败: %w", err)
	}

	return document, nil
}

func (repository *documentRepository) findNextDocumentRevisionNumberTx(ctx context.Context, tx pgx.Tx, documentID int64) (int64, error) {
	query := `
		SELECT COALESCE(MAX(revision_number), 0) + 1
		FROM document_revisions
		WHERE document_id = $1
	`

	var nextRevisionNumber int64
	if err := tx.QueryRow(ctx, query, documentID).Scan(&nextRevisionNumber); err != nil {
		return 0, fmt.Errorf("计算下一个文档历史版本号失败: %w", err)
	}

	return nextRevisionNumber, nil
}

func (repository *documentRepository) insertDocumentRevisionTx(
	ctx context.Context,
	tx pgx.Tx,
	documentID int64,
	revisionNumber int64,
	snapshotContent string,
	operation model.DocumentRevisionOperation,
	sourceRevisionID *int64,
) (*model.DocumentRevision, error) {
	query := `
		INSERT INTO document_revisions (
			document_id,
			revision_number,
			snapshot_content,
			content_size,
			operation,
			source_revision_id
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, document_id, revision_number, snapshot_content, content_size, operation, source_revision_id, created_at
	`

	var sourceRevisionValue any
	if sourceRevisionID != nil {
		sourceRevisionValue = *sourceRevisionID
	}

	revision, err := scanDocumentRevision(tx.QueryRow(
		ctx,
		query,
		documentID,
		revisionNumber,
		snapshotContent,
		utf8.RuneCountInString(snapshotContent),
		operation,
		sourceRevisionValue,
	))
	if err != nil {
		return nil, fmt.Errorf("写入文档历史版本失败: %w", err)
	}

	return revision, nil
}

func (repository *documentRepository) findDocumentRevisionByIDTx(
	ctx context.Context,
	tx pgx.Tx,
	revisionID int64,
	documentID int64,
) (*model.DocumentRevision, error) {
	query := `
		SELECT id, document_id, revision_number, snapshot_content, content_size, operation, source_revision_id, created_at
		FROM document_revisions
		WHERE id = $1 AND document_id = $2
		LIMIT 1
	`

	revision, err := scanDocumentRevision(tx.QueryRow(ctx, query, revisionID, documentID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentRevisionNotFound
		}

		return nil, fmt.Errorf("查询文档历史版本失败: %w", err)
	}

	return revision, nil
}

func (repository *documentRepository) findLatestDocumentRevisionByDocumentIDTx(
	ctx context.Context,
	tx pgx.Tx,
	documentID int64,
) (*model.DocumentRevision, error) {
	query := `
		SELECT id, document_id, revision_number, snapshot_content, content_size, operation, source_revision_id, created_at
		FROM document_revisions
		WHERE document_id = $1
		ORDER BY revision_number DESC, id DESC
		LIMIT 1
	`

	revision, err := scanDocumentRevision(tx.QueryRow(ctx, query, documentID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrDocumentRevisionNotFound
		}

		return nil, fmt.Errorf("查询当前最新文档历史版本失败: %w", err)
	}

	return revision, nil
}

func (repository *documentRepository) insertManualDocumentRevisionIfNeededTx(
	ctx context.Context,
	tx pgx.Tx,
	documentID int64,
	content string,
) (bool, error) {
	latestRevision, err := repository.findLatestDocumentRevisionByDocumentIDTx(ctx, tx, documentID)
	if err != nil && !errors.Is(err, appconst.ErrDocumentRevisionNotFound) {
		return false, err
	}

	if latestRevision != nil && latestRevision.SnapshotContent == content {
		return false, nil
	}

	nextRevisionNumber := int64(1)
	if latestRevision != nil {
		nextRevisionNumber = latestRevision.RevisionNumber + 1
	} else {
		nextRevisionNumber, err = repository.findNextDocumentRevisionNumberTx(ctx, tx, documentID)
		if err != nil {
			return false, err
		}
	}

	if _, err := repository.insertDocumentRevisionTx(
		ctx,
		tx,
		documentID,
		nextRevisionNumber,
		content,
		model.DocumentRevisionOperationUpdate,
		nil,
	); err != nil {
		return false, err
	}

	return true, nil
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

func scanDocumentRevision(scanner documentScanner) (*model.DocumentRevision, error) {
	var sourceRevisionID sql.NullInt64
	revision := &model.DocumentRevision{}
	if err := scanner.Scan(
		&revision.ID,
		&revision.DocumentID,
		&revision.RevisionNumber,
		&revision.SnapshotContent,
		&revision.ContentSize,
		&revision.Operation,
		&sourceRevisionID,
		&revision.CreatedAt,
	); err != nil {
		return nil, fmt.Errorf("扫描文档历史版本数据失败: %w", err)
	}

	if sourceRevisionID.Valid {
		revisionIDValue := sourceRevisionID.Int64
		revision.SourceRevisionID = &revisionIDValue
	}

	return revision, nil
}
