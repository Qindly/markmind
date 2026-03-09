// postgres.go - 负责初始化 PostgreSQL 连接池
package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPostgresPool - 创建 PostgreSQL 连接池
// 参数 ctx: 初始化上下文
// 参数 databaseURL: PostgreSQL 连接字符串
// 返回值：连接池实例与可能的错误
func NewPostgresPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("创建 PostgreSQL 连接池失败: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("连接 PostgreSQL 失败: %w", err)
	}

	return pool, nil
}
