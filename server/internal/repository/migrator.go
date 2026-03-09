// migrator.go - 负责按顺序执行 SQL 迁移文件
package repository

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations - 执行指定目录中的 up 迁移
// 参数 ctx: 执行上下文
// 参数 pool: PostgreSQL 连接池
// 参数 migrationsDir: 迁移文件目录
// 返回值：可能的错误
func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	if err := ensureSchemaMigrations(ctx, pool); err != nil {
		return err
	}

	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return fmt.Errorf("扫描迁移文件失败: %w", err)
	}

	sort.Strings(files)
	for _, filePath := range files {
		name := filepath.Base(filePath)
		applied, err := isMigrationApplied(ctx, pool, name)
		if err != nil {
			return err
		}

		if applied {
			continue
		}

		statement, err := extractUpStatement(filePath)
		if err != nil {
			return err
		}

		if strings.TrimSpace(statement) == "" {
			continue
		}

		if _, err := pool.Exec(ctx, statement); err != nil {
			return fmt.Errorf("执行迁移 %s 失败: %w", name, err)
		}

		if _, err := pool.Exec(ctx, `INSERT INTO schema_migrations (name) VALUES ($1)`, name); err != nil {
			return fmt.Errorf("记录迁移 %s 失败: %w", name, err)
		}
	}

	return nil
}

func ensureSchemaMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`

	if _, err := pool.Exec(ctx, query); err != nil {
		return fmt.Errorf("创建 schema_migrations 表失败: %w", err)
	}

	return nil
}

func isMigrationApplied(ctx context.Context, pool *pgxpool.Pool, name string) (bool, error) {
	var exists bool
	err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = $1)`, name).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("查询迁移 %s 状态失败: %w", name, err)
	}

	return exists, nil
}

func extractUpStatement(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("打开迁移文件失败: %w", err)
	}
	defer file.Close()

	var builder strings.Builder
	scanner := bufio.NewScanner(file)
	recording := false

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		switch trimmed {
		case "-- +up":
			recording = true
			continue
		case "-- +down":
			recording = false
			continue
		}

		if recording {
			builder.WriteString(line)
			builder.WriteString("\n")
		}
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("读取迁移文件失败: %w", err)
	}

	return builder.String(), nil
}
