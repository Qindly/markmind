// folder_repository.go - 封装文件夹相关的 PostgreSQL 操作
package repository

import (
	"context"
	"errors"
	"fmt"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// FolderRepository - 文件夹数据访问接口。
type FolderRepository interface {
	ListFoldersByUserID(ctx context.Context, userID int64) ([]model.Folder, error)
	CreateFolder(ctx context.Context, folder model.Folder) (*model.Folder, error)
	FindFolderByIDAndUserID(ctx context.Context, folderID int64, userID int64) (*model.Folder, error)
	UpdateFolderNameByIDAndUserID(ctx context.Context, folderID int64, userID int64, name string) (*model.Folder, error)
	DeleteFolderByIDAndUserID(ctx context.Context, folderID int64, userID int64) error
}

type folderRepository struct {
	pool *pgxpool.Pool
}

// NewFolderRepository - 创建文件夹仓储实现。
// 参数 pool: PostgreSQL 连接池。
// 返回值：文件夹仓储实例。
func NewFolderRepository(pool *pgxpool.Pool) FolderRepository {
	return &folderRepository{pool: pool}
}

func (repository *folderRepository) ListFoldersByUserID(ctx context.Context, userID int64) ([]model.Folder, error) {
	query := `
		SELECT id, user_id, name, created_at, updated_at
		FROM folders
		WHERE user_id = $1
		ORDER BY created_at ASC, id ASC
	`

	rows, err := repository.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("查询文件夹列表失败: %w", err)
	}
	defer rows.Close()

	folders := make([]model.Folder, 0)
	for rows.Next() {
		var folder model.Folder
		if err := rows.Scan(&folder.ID, &folder.UserID, &folder.Name, &folder.CreatedAt, &folder.UpdatedAt); err != nil {
			return nil, fmt.Errorf("扫描文件夹数据失败: %w", err)
		}

		folders = append(folders, folder)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历文件夹列表失败: %w", err)
	}

	return folders, nil
}

func (repository *folderRepository) CreateFolder(ctx context.Context, folder model.Folder) (*model.Folder, error) {
	query := `
		INSERT INTO folders (user_id, name)
		VALUES ($1, $2)
		RETURNING id, user_id, name, created_at, updated_at
	`

	createdFolder := &model.Folder{}
	if err := repository.pool.QueryRow(ctx, query, folder.UserID, folder.Name).Scan(
		&createdFolder.ID,
		&createdFolder.UserID,
		&createdFolder.Name,
		&createdFolder.CreatedAt,
		&createdFolder.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("创建文件夹失败: %w", err)
	}

	return createdFolder, nil
}

func (repository *folderRepository) FindFolderByIDAndUserID(ctx context.Context, folderID int64, userID int64) (*model.Folder, error) {
	query := `
		SELECT id, user_id, name, created_at, updated_at
		FROM folders
		WHERE id = $1 AND user_id = $2
		LIMIT 1
	`

	folder := &model.Folder{}
	if err := repository.pool.QueryRow(ctx, query, folderID, userID).Scan(
		&folder.ID,
		&folder.UserID,
		&folder.Name,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrFolderNotFound
		}

		return nil, fmt.Errorf("查询文件夹失败: %w", err)
	}

	return folder, nil
}

func (repository *folderRepository) UpdateFolderNameByIDAndUserID(ctx context.Context, folderID int64, userID int64, name string) (*model.Folder, error) {
	query := `
		UPDATE folders
		SET name = $3, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, name, created_at, updated_at
	`

	updatedFolder := &model.Folder{}
	if err := repository.pool.QueryRow(ctx, query, folderID, userID, name).Scan(
		&updatedFolder.ID,
		&updatedFolder.UserID,
		&updatedFolder.Name,
		&updatedFolder.CreatedAt,
		&updatedFolder.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrFolderNotFound
		}

		return nil, fmt.Errorf("更新文件夹失败: %w", err)
	}

	return updatedFolder, nil
}

func (repository *folderRepository) DeleteFolderByIDAndUserID(ctx context.Context, folderID int64, userID int64) error {
	query := `
		DELETE FROM folders
		WHERE id = $1 AND user_id = $2
	`

	result, err := repository.pool.Exec(ctx, query, folderID, userID)
	if err != nil {
		return fmt.Errorf("删除文件夹失败: %w", err)
	}

	if result.RowsAffected() == 0 {
		return appconst.ErrFolderNotFound
	}

	return nil
}
