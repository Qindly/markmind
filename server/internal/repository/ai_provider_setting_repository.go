// ai_provider_setting_repository.go - 封装用户级 AI Provider 配置的 PostgreSQL 操作
package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AIProviderSettingRepository - 用户级 AI Provider 配置的数据访问接口。
type AIProviderSettingRepository interface {
	FindByUserID(ctx context.Context, userID int64) (*model.AIProviderSetting, error)
	Upsert(ctx context.Context, setting model.AIProviderSetting) (*model.AIProviderSetting, error)
}

type aiProviderSettingRepository struct {
	pool *pgxpool.Pool
}

// NewAIProviderSettingRepository - 创建 AI Provider 配置仓储实现。
// 参数 pool: PostgreSQL 连接池。
// 返回值：AI Provider 配置仓储实例。
func NewAIProviderSettingRepository(pool *pgxpool.Pool) AIProviderSettingRepository {
	return &aiProviderSettingRepository{pool: pool}
}

func (repository *aiProviderSettingRepository) FindByUserID(ctx context.Context, userID int64) (*model.AIProviderSetting, error) {
	query := `
		SELECT user_id, base_url, api_key_encrypted, model, created_at, updated_at
		FROM ai_provider_settings
		WHERE user_id = $1
		LIMIT 1
	`

	setting, err := scanAIProviderSetting(repository.pool.QueryRow(ctx, query, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("查询 AI Provider 配置失败: %w", err)
	}

	return setting, nil
}

func (repository *aiProviderSettingRepository) Upsert(ctx context.Context, setting model.AIProviderSetting) (*model.AIProviderSetting, error) {
	query := `
		INSERT INTO ai_provider_settings (user_id, base_url, api_key_encrypted, model)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE
		SET base_url = EXCLUDED.base_url,
			api_key_encrypted = EXCLUDED.api_key_encrypted,
			model = EXCLUDED.model,
			updated_at = NOW()
		RETURNING user_id, base_url, api_key_encrypted, model, created_at, updated_at
	`

	savedSetting, err := scanAIProviderSetting(
		repository.pool.QueryRow(ctx, query, setting.UserID, setting.BaseURL, setting.APIKeyEncrypted, setting.Model),
	)
	if err != nil {
		return nil, fmt.Errorf("写入 AI Provider 配置失败: %w", err)
	}

	return savedSetting, nil
}

type aiProviderSettingScanner interface {
	Scan(dest ...any) error
}

func scanAIProviderSetting(scanner aiProviderSettingScanner) (*model.AIProviderSetting, error) {
	setting := &model.AIProviderSetting{}
	if err := scanner.Scan(
		&setting.UserID,
		&setting.BaseURL,
		&setting.APIKeyEncrypted,
		&setting.Model,
		&setting.CreatedAt,
		&setting.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("扫描 AI Provider 配置失败: %w", err)
	}

	return setting, nil
}
