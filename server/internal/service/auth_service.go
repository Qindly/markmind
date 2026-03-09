// auth_service.go - 编排注册登录刷新登出等鉴权业务逻辑
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/config"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/model"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/util"
)

// AuthServicer - 鉴权服务接口
type AuthServicer interface {
	Register(ctx context.Context, request dto.RegisterRequest) (*dto.RegisterResponse, error)
	Login(ctx context.Context, request dto.LoginRequest) (*dto.AuthSession, error)
	RefreshSession(ctx context.Context, refreshToken string) (*dto.AuthSession, error)
	Logout(ctx context.Context, refreshToken string) error
	GetCurrentUser(ctx context.Context, userID int64) (*dto.UserProfileResponse, error)
}

type authService struct {
	userRepository    repository.UserRepository
	sessionRepository repository.SessionRepository
	jwtManager        *util.JWTManager
	config            config.Config
}

// NewAuthService - 创建鉴权服务实现
// 参数 userRepository: 用户仓储
// 参数 sessionRepository: 会话仓储
// 参数 jwtManager: JWT 管理器
// 参数 cfg: 应用配置
// 返回值：鉴权服务实例
func NewAuthService(
	userRepository repository.UserRepository,
	sessionRepository repository.SessionRepository,
	jwtManager *util.JWTManager,
	cfg config.Config,
) AuthServicer {
	return &authService{
		userRepository:    userRepository,
		sessionRepository: sessionRepository,
		jwtManager:        jwtManager,
		config:            cfg,
	}
}

func (service *authService) Register(ctx context.Context, request dto.RegisterRequest) (*dto.RegisterResponse, error) {
	trimmedUsername := strings.TrimSpace(request.Username)
	trimmedEmail := strings.TrimSpace(strings.ToLower(request.Email))

	if request.Password != request.ConfirmPassword {
		return nil, appconst.ErrPasswordMismatch
	}

	if trimmedUsername == "" || trimmedEmail == "" {
		return nil, appconst.ErrInvalidParams
	}

	usernameExists, err := service.userRepository.UsernameExists(ctx, trimmedUsername)
	if err != nil {
		return nil, fmt.Errorf("检查用户名是否存在失败: %w", err)
	}
	if usernameExists {
		return nil, appconst.ErrUsernameExists
	}

	emailExists, err := service.userRepository.EmailExists(ctx, trimmedEmail)
	if err != nil {
		return nil, fmt.Errorf("检查邮箱是否存在失败: %w", err)
	}
	if emailExists {
		return nil, appconst.ErrEmailExists
	}

	passwordHash, err := util.HashPassword(request.Password)
	if err != nil {
		return nil, err
	}

	createdUser, err := service.userRepository.CreateUser(ctx, model.User{
		Username:     trimmedUsername,
		Email:        trimmedEmail,
		PasswordHash: passwordHash,
	})
	if err != nil {
		if errors.Is(err, appconst.ErrUsernameExists) || errors.Is(err, appconst.ErrEmailExists) {
			return nil, err
		}

		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	return &dto.RegisterResponse{
		User: toUserProfile(createdUser),
	}, nil
}

func (service *authService) Login(ctx context.Context, request dto.LoginRequest) (*dto.AuthSession, error) {
	identifier := strings.TrimSpace(request.Identifier)
	if identifier == "" {
		return nil, appconst.ErrInvalidParams
	}

	user, err := service.userRepository.FindByIdentifier(ctx, identifier)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidCredentials) {
			return nil, appconst.ErrInvalidCredentials
		}

		return nil, fmt.Errorf("查询登录用户失败: %w", err)
	}

	if err := util.ComparePassword(user.PasswordHash, request.Password); err != nil {
		return nil, appconst.ErrInvalidCredentials
	}

	return service.buildSession(ctx, user)
}

func (service *authService) RefreshSession(ctx context.Context, refreshToken string) (*dto.AuthSession, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, appconst.ErrInvalidRefreshToken
	}

	userID, err := service.sessionRepository.GetUserIDByRefreshToken(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidRefreshToken) {
			return nil, appconst.ErrInvalidRefreshToken
		}

		return nil, fmt.Errorf("读取 Refresh Token 对应用户失败: %w", err)
	}

	storedToken, err := service.sessionRepository.GetRefreshTokenByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidRefreshToken) {
			return nil, appconst.ErrInvalidRefreshToken
		}

		return nil, fmt.Errorf("读取用户 Refresh Token 失败: %w", err)
	}

	if storedToken != refreshToken {
		return nil, appconst.ErrInvalidRefreshToken
	}

	user, err := service.userRepository.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidCredentials) {
			return nil, appconst.ErrUnauthorized
		}

		return nil, fmt.Errorf("读取刷新用户信息失败: %w", err)
	}

	return service.buildSession(ctx, user)
}

func (service *authService) Logout(ctx context.Context, refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return nil
	}

	userID, err := service.sessionRepository.GetUserIDByRefreshToken(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidRefreshToken) {
			return nil
		}

		return fmt.Errorf("查找待登出用户失败: %w", err)
	}

	if err := service.sessionRepository.DeleteRefreshToken(ctx, userID, refreshToken); err != nil {
		return fmt.Errorf("删除 Refresh Token 失败: %w", err)
	}

	return nil
}

func (service *authService) GetCurrentUser(ctx context.Context, userID int64) (*dto.UserProfileResponse, error) {
	user, err := service.userRepository.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, appconst.ErrInvalidCredentials) {
			return nil, appconst.ErrUnauthorized
		}

		return nil, fmt.Errorf("读取当前用户信息失败: %w", err)
	}

	profile := toUserProfile(user)
	return &profile, nil
}

func (service *authService) buildSession(ctx context.Context, user *model.User) (*dto.AuthSession, error) {
	accessToken, err := service.jwtManager.GenerateAccessToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("生成 Access Token 失败: %w", err)
	}

	refreshToken, err := util.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("生成 Refresh Token 失败: %w", err)
	}

	if err := service.sessionRepository.SaveRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, fmt.Errorf("保存 Refresh Token 失败: %w", err)
	}

	return &dto.AuthSession{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserProfile(user),
	}, nil
}

func toUserProfile(user *model.User) dto.UserProfileResponse {
	return dto.UserProfileResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
}
