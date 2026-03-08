// redis.go - 负责初始化 Redis 客户端
package repository

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// NewRedisClient - 创建 Redis 客户端并验证连通性
// 参数 ctx: 初始化上下文
// 参数 addr: Redis 地址
// 参数 password: Redis 密码
// 参数 db: Redis 数据库编号
// 返回值：Redis 客户端与可能的错误
func NewRedisClient(ctx context.Context, addr string, password string, db int) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("连接 Redis 失败: %w", err)
	}

	return client, nil
}
