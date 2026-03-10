// document_service.go - 编排文档详情查询与正文保存业务逻辑
package service

import (
	"context"
	"strings"

	appconst "github.com/Qindly/markmind/internal/const"
	"github.com/Qindly/markmind/internal/dto"
	"github.com/Qindly/markmind/internal/model"
	"github.com/Qindly/markmind/internal/repository"
	"github.com/Qindly/markmind/internal/util"
)

// DocumentServicer - 文档详情与正文编辑服务接口。
type DocumentServicer interface {
	GetDocumentDetail(ctx context.Context, userID int64, documentID int64) (*dto.GetDocumentDetailResponse, error)
	SearchDocuments(ctx context.Context, userID int64, request dto.SearchDocumentsRequest) (*dto.SearchDocumentsResponse, error)
	UpdateDocumentContent(ctx context.Context, userID int64, documentID int64, request dto.UpdateDocumentContentRequest) (*dto.UpdateDocumentContentResponse, error)
}

type documentService struct {
	folderRepository   repository.FolderRepository
	documentRepository repository.DocumentRepository
}

// NewDocumentService - 创建文档详情与正文编辑服务实现。
// 参数 folderRepository: 文件夹仓储。
// 参数 documentRepository: 文档仓储。
// 返回值：文档服务实例。
func NewDocumentService(
	folderRepository repository.FolderRepository,
	documentRepository repository.DocumentRepository,
) DocumentServicer {
	return &documentService{
		folderRepository:   folderRepository,
		documentRepository: documentRepository,
	}
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

func (service *documentService) SearchDocuments(
	ctx context.Context,
	userID int64,
	request dto.SearchDocumentsRequest,
) (*dto.SearchDocumentsResponse, error) {
	keyword := strings.TrimSpace(request.Keyword)
	if keyword == "" {
		return nil, appconst.ErrInvalidParams
	}

	if request.FolderID != nil {
		if *request.FolderID <= 0 {
			return nil, appconst.ErrInvalidParams
		}

		if _, err := service.folderRepository.FindFolderByIDAndUserID(ctx, *request.FolderID, userID); err != nil {
			return nil, err
		}
	}

	documents, err := service.documentRepository.SearchDocumentsByKeyword(ctx, userID, request.FolderID, keyword)
	if err != nil {
		return nil, err
	}

	response := &dto.SearchDocumentsResponse{
		Documents: make([]dto.DocumentSearchSummaryResponse, 0, len(documents)),
	}
	for _, document := range documents {
		response.Documents = append(response.Documents, toDocumentSearchSummary(document, keyword))
	}

	return response, nil
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

func toDocumentSearchSummary(document model.Document, keyword string) dto.DocumentSearchSummaryResponse {
	matchSources := util.BuildSearchMatchSources(document.Title, document.Content, keyword)

	return dto.DocumentSearchSummaryResponse{
		ID:           document.ID,
		FolderID:     document.FolderID,
		Title:        document.Title,
		Snippet:      util.BuildSearchSnippet(document.Content, keyword),
		MatchSources: toDocumentSearchMatchSources(matchSources),
		CreatedAt:    document.CreatedAt,
		UpdatedAt:    document.UpdatedAt,
	}
}

func toDocumentSearchMatchSources(matchSources []util.SearchMatchSource) []dto.DocumentSearchMatchSource {
	if len(matchSources) == 0 {
		return nil
	}

	responseSources := make([]dto.DocumentSearchMatchSource, 0, len(matchSources))
	for _, matchSource := range matchSources {
		responseSources = append(responseSources, dto.DocumentSearchMatchSource(matchSource))
	}

	return responseSources
}
