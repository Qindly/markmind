// session_repository.go - 封装 Refresh Token 的 Redis 存储逻辑
package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/redis/go-redis/v9"
)

// SessionRepository - Refresh Token 存储接口
type SessionRepository interface {
	SaveRefreshToken(ctx context.Context, userID int64, token string) error
	GetUserIDByRefreshToken(ctx context.Context, token string) (int64, error)
	GetRefreshTokenByUserID(ctx context.Context, userID int64) (string, error)
	DeleteRefreshToken(ctx context.Context, userID int64, token string) error
}

type sessionRepository struct {
	client *redis.Client
	ttl    time.Duration
}

// NewSessionRepository - 创建 Refresh Token 仓储实现
// 参数 client: Redis 客户端
// 参数 ttl: Refresh Token 有效期
// 返回值：会话仓储实例
func NewSessionRepository(client *redis.Client, ttl time.Duration) SessionRepository {
	return &sessionRepository{client: client, ttl: ttl}
}

func (repository *sessionRepository) SaveRefreshToken(ctx context.Context, userID int64, token string) error {
	userKey := buildUserRefreshTokenKey(userID)
	lookupKey := buildRefreshTokenLookupKey(token)

	previousToken, err := repository.client.Get(ctx, userKey).Result()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("读取旧 Refresh Token 失败: %w", err)
	}

	pipe := repository.client.TxPipeline()
	pipe.Set(ctx, userKey, token, repository.ttl)
	pipe.Set(ctx, lookupKey, userID, repository.ttl)
	if previousToken != "" {
		pipe.Del(ctx, buildRefreshTokenLookupKey(previousToken))
	}

	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("保存 Refresh Token 失败: %w", err)
	}

	return nil
}

func (repository *sessionRepository) GetUserIDByRefreshToken(ctx context.Context, token string) (int64, error) {
	lookupKey := buildRefreshTokenLookupKey(token)
	userID, err := repository.client.Get(ctx, lookupKey).Int64()
	if err != nil {
		if err == redis.Nil {
			return 0, appconst.ErrInvalidRefreshToken
		}

		return 0, fmt.Errorf("查询 Refresh Token 对应用户失败: %w", err)
	}

	return userID, nil
}

func (repository *sessionRepository) GetRefreshTokenByUserID(ctx context.Context, userID int64) (string, error) {
	token, err := repository.client.Get(ctx, buildUserRefreshTokenKey(userID)).Result()
	if err != nil {
		if err == redis.Nil {
			return "", appconst.ErrInvalidRefreshToken
		}

		return "", fmt.Errorf("读取用户 Refresh Token 失败: %w", err)
	}

	return token, nil
}

func (repository *sessionRepository) DeleteRefreshToken(ctx context.Context, userID int64, token string) error {
	pipe := repository.client.TxPipeline()
	pipe.Del(ctx, buildUserRefreshTokenKey(userID))
	if token != "" {
		pipe.Del(ctx, buildRefreshTokenLookupKey(token))
	}

	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("删除 Refresh Token 失败: %w", err)
	}

	return nil
}

func buildUserRefreshTokenKey(userID int64) string {
	return fmt.Sprintf("markmind:rt:%d", userID)
}

func buildRefreshTokenLookupKey(token string) string {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("markmind:rt_lookup:%s", hex.EncodeToString(hash[:]))
}
