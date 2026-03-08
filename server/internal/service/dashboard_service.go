// dashboard_service.go - 编排首页列表与创建文件夹/文档的业务逻辑
package service

import (
	"context"
	"fmt"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/model"
	"github.com/Qindly/markmind/internal/repository"
)

const defaultDocumentTitle = "未命名文档"

// DashboardServicer - 首页业务服务接口
type DashboardServicer interface {
	GetDashboard(ctx context.Context, userID int64) (*dto.DashboardResponse, error)
	CreateFolder(ctx context.Context, userID int64, request dto.CreateFolderRequest) (*dto.CreateFolderResponse, error)
	CreateDocument(ctx context.Context, userID int64, request dto.CreateDocumentRequest) (*dto.CreateDocumentResponse, error)
}

type dashboardService struct {
	folderRepository   repository.FolderRepository
	documentRepository repository.DocumentRepository
}

// NewDashboardService - 创建首页业务服务实现
// 参数 folderRepository: 文件夹仓储
// 参数 documentRepository: 文档仓储
// 返回值：首页业务服务实例
func NewDashboardService(
	folderRepository repository.FolderRepository,
	documentRepository repository.DocumentRepository,
) DashboardServicer {
	return &dashboardService{
		folderRepository:   folderRepository,
		documentRepository: documentRepository,
	}
}

func (service *dashboardService) GetDashboard(ctx context.Context, userID int64) (*dto.DashboardResponse, error) {
	folders, err := service.folderRepository.ListFoldersByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	documents, err := service.documentRepository.ListDocumentsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	response := &dto.DashboardResponse{
		Folders:   make([]dto.FolderSummaryResponse, 0, len(folders)),
		Documents: make([]dto.DocumentSummaryResponse, 0, len(documents)),
	}

	for _, folder := range folders {
		response.Folders = append(response.Folders, toFolderSummary(folder))
	}

	for _, document := range documents {
		response.Documents = append(response.Documents, toDocumentSummary(document))
	}

	return response, nil
}

func (service *dashboardService) CreateFolder(ctx context.Context, userID int64, request dto.CreateFolderRequest) (*dto.CreateFolderResponse, error) {
	name := strings.TrimSpace(request.Name)
	if name == "" {
		return nil, appconst.ErrFolderNameRequired
	}

	createdFolder, err := service.folderRepository.CreateFolder(ctx, model.Folder{
		UserID: userID,
		Name:   name,
	})
	if err != nil {
		return nil, fmt.Errorf("创建首页文件夹失败: %w", err)
	}

	return &dto.CreateFolderResponse{
		Folder: toFolderSummary(*createdFolder),
	}, nil
}

func (service *dashboardService) CreateDocument(ctx context.Context, userID int64, request dto.CreateDocumentRequest) (*dto.CreateDocumentResponse, error) {
	if request.FolderID != nil {
		if *request.FolderID <= 0 {
			return nil, appconst.ErrInvalidParams
		}

		if _, err := service.folderRepository.FindFolderByIDAndUserID(ctx, *request.FolderID, userID); err != nil {
			return nil, err
		}
	}

	title := strings.TrimSpace(request.Title)
	if title == "" {
		title = defaultDocumentTitle
	}

	createdDocument, err := service.documentRepository.CreateDocument(ctx, model.Document{
		UserID:   userID,
		FolderID: request.FolderID,
		Title:    title,
		Content:  "",
	})
	if err != nil {
		return nil, fmt.Errorf("创建首页文档失败: %w", err)
	}

	return &dto.CreateDocumentResponse{
		Document: toDocumentSummary(*createdDocument),
	}, nil
}

func toFolderSummary(folder model.Folder) dto.FolderSummaryResponse {
	return dto.FolderSummaryResponse{
		ID:        folder.ID,
		Name:      folder.Name,
		CreatedAt: folder.CreatedAt,
		UpdatedAt: folder.UpdatedAt,
	}
}

func toDocumentSummary(document model.Document) dto.DocumentSummaryResponse {
	return dto.DocumentSummaryResponse{
		ID:        document.ID,
		FolderID:  document.FolderID,
		Title:     document.Title,
		CreatedAt: document.CreatedAt,
		UpdatedAt: document.UpdatedAt,
	}
}
