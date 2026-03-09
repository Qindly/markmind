// document_service.go - 编排文档详情查询与正文保存业务逻辑
package service

import (
	"context"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/model"
	"github.com/Qindly/markmind/internal/repository"
)

// DocumentServicer - 文档详情与正文编辑服务接口。
type DocumentServicer interface {
	GetDocumentDetail(ctx context.Context, userID int64, documentID int64) (*dto.GetDocumentDetailResponse, error)
	UpdateDocumentContent(ctx context.Context, userID int64, documentID int64, request dto.UpdateDocumentContentRequest) (*dto.UpdateDocumentContentResponse, error)
}

type documentService struct {
	documentRepository repository.DocumentRepository
}

// NewDocumentService - 创建文档详情与正文编辑服务实现。
// 参数 documentRepository: 文档仓储。
// 返回值：文档服务实例。
func NewDocumentService(documentRepository repository.DocumentRepository) DocumentServicer {
	return &documentService{documentRepository: documentRepository}
}

func (service *documentService) GetDocumentDetail(
	ctx context.Context,
	userID int64,
	documentID int64,
) (*dto.GetDocumentDetailResponse, error) {
	if documentID <= 0 {
		return nil, appconst.ErrInvalidParams
	}

	document, err := service.documentRepository.FindDocumentByIDAndUserID(ctx, documentID, userID)
	if err != nil {
		return nil, err
	}

	return &dto.GetDocumentDetailResponse{
		Document: toDocumentDetail(*document),
	}, nil
}

func (service *documentService) UpdateDocumentContent(
	ctx context.Context,
	userID int64,
	documentID int64,
	request dto.UpdateDocumentContentRequest,
) (*dto.UpdateDocumentContentResponse, error) {
	if documentID <= 0 {
		return nil, appconst.ErrInvalidParams
	}

	updatedDocument, err := service.documentRepository.UpdateDocumentContentByIDAndUserID(
		ctx,
		documentID,
		userID,
		request.Content,
	)
	if err != nil {
		return nil, err
	}

	return &dto.UpdateDocumentContentResponse{
		Document: toDocumentDetail(*updatedDocument),
	}, nil
}

func toDocumentDetail(document model.Document) dto.DocumentDetailResponseData {
	return dto.DocumentDetailResponseData{
		ID:        document.ID,
		FolderID:  document.FolderID,
		Title:     document.Title,
		Content:   document.Content,
		CreatedAt: document.CreatedAt,
		UpdatedAt: document.UpdatedAt,
	}
}
