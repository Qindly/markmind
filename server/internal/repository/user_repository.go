// user_repository.go - 封装用户相关的 PostgreSQL 操作
package repository

import (
	"context"
	"errors"
	"fmt"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository - 用户数据访问接口
type UserRepository interface {
	CreateUser(ctx context.Context, user model.User) (*model.User, error)
	UsernameExists(ctx context.Context, username string) (bool, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	FindByIdentifier(ctx context.Context, identifier string) (*model.User, error)
	FindByID(ctx context.Context, userID int64) (*model.User, error)
}

type userRepository struct {
	pool *pgxpool.Pool
}

// NewUserRepository - 创建用户仓储实现
// 参数 pool: PostgreSQL 连接池
// 返回值：用户仓储实例
func NewUserRepository(pool *pgxpool.Pool) UserRepository {
	return &userRepository{pool: pool}
}

func (repository *userRepository) CreateUser(ctx context.Context, user model.User) (*model.User, error) {
	query := `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, password_hash, created_at, updated_at
	`

	createdUser := &model.User{}
	err := repository.pool.QueryRow(ctx, query, user.Username, user.Email, user.PasswordHash).Scan(
		&createdUser.ID,
		&createdUser.Username,
		&createdUser.Email,
		&createdUser.PasswordHash,
		&createdUser.CreatedAt,
		&createdUser.UpdatedAt,
	)
	if err != nil {
		var pgError *pgconn.PgError
		if errors.As(err, &pgError) && pgError.Code == "23505" {
			switch pgError.ConstraintName {
			case "users_username_key":
				return nil, appconst.ErrUsernameExists
			case "users_email_key":
				return nil, appconst.ErrEmailExists
			}
		}

		return nil, fmt.Errorf("写入用户失败: %w", err)
	}

	return createdUser, nil
}

func (repository *userRepository) UsernameExists(ctx context.Context, username string) (bool, error) {
	return repository.exists(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`, username)
}

func (repository *userRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	return repository.exists(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email)
}

func (repository *userRepository) FindByIdentifier(ctx context.Context, identifier string) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1 OR username = $1
		LIMIT 1
	`

	return repository.findOne(ctx, query, identifier)
}

func (repository *userRepository) FindByID(ctx context.Context, userID int64) (*model.User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`

	return repository.findOne(ctx, query, userID)
}

func (repository *userRepository) exists(ctx context.Context, query string, value string) (bool, error) {
	var exists bool
	if err := repository.pool.QueryRow(ctx, query, value).Scan(&exists); err != nil {
		return false, fmt.Errorf("查询存在性失败: %w", err)
	}

	return exists, nil
}

func (repository *userRepository) findOne(ctx context.Context, query string, args ...any) (*model.User, error) {
	user := &model.User{}
	err := repository.pool.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, appconst.ErrInvalidCredentials
		}

		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	return user, nil
}
