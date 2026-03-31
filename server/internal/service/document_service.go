// document_service.go - 编排文档详情、历史版本与正文保存业务逻辑
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

const (
	rootFolderDisplayName     = "根目录"
	unknownFolderDisplayName  = "未知目录"
	documentRevisionListLimit = 20
)

// DocumentServicer - 文档详情、历史版本与正文编辑服务接口。
type DocumentServicer interface {
	GetDocumentDetail(ctx context.Context, userID int64, documentID int64) (*dto.GetDocumentDetailResponse, error)
	SearchDocuments(ctx context.Context, userID int64, request dto.SearchDocumentsRequest) (*dto.SearchDocumentsResponse, error)
	UpdateDocumentContent(ctx context.Context, userID int64, documentID int64, request dto.UpdateDocumentContentRequest) (*dto.UpdateDocumentContentResponse, error)
	ListDocumentRevisions(ctx context.Context, userID int64, documentID int64) (*dto.ListDocumentRevisionsResponse, error)
	GetDocumentRevisionDiff(ctx context.Context, userID int64, documentID int64, request dto.DocumentRevisionDiffRequest) (*dto.GetDocumentRevisionDiffResponse, error)
	RollbackDocumentRevision(ctx context.Context, userID int64, documentID int64, revisionID int64) (*dto.RollbackDocumentRevisionResponse, error)
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

	documentDetail, err := service.toDocumentDetailResponseData(ctx, userID, *document)
	if err != nil {
		return nil, err
	}

	return &dto.GetDocumentDetailResponse{
		Document: documentDetail,
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

	if request.Scope != dto.DocumentSearchScopeCurrentFolder && request.Scope != dto.DocumentSearchScopeGlobal {
		return nil, appconst.ErrInvalidParams
	}

	currentFolderName := rootFolderDisplayName
	folderNameMap := make(map[int64]string)

	if request.Scope == dto.DocumentSearchScopeCurrentFolder && request.FolderID != nil {
		if *request.FolderID <= 0 {
			return nil, appconst.ErrInvalidParams
		}

		folder, err := service.folderRepository.FindFolderByIDAndUserID(ctx, *request.FolderID, userID)
		if err != nil {
			return nil, err
		}

		currentFolderName = folder.Name
	}

	if request.Scope == dto.DocumentSearchScopeGlobal {
		var err error
		folderNameMap, err = service.listFolderNamesByUserID(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	documents, err := service.documentRepository.SearchDocumentsByKeyword(
		ctx,
		userID,
		request.FolderID,
		keyword,
		request.Scope == dto.DocumentSearchScopeGlobal,
	)
	if err != nil {
		return nil, err
	}

	response := &dto.SearchDocumentsResponse{
		Documents: make([]dto.DocumentSearchSummaryResponse, 0, len(documents)),
	}
	for _, document := range documents {
		response.Documents = append(
			response.Documents,
			toDocumentSearchSummary(document, keyword, resolveSearchResultFolderName(document.FolderID, currentFolderName, folderNameMap)),
		)
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

	saveMode := dto.NormalizeDocumentContentSaveMode(request.SaveMode)
	if !dto.IsValidDocumentContentSaveMode(saveMode) {
		return nil, appconst.ErrInvalidParams
	}

	updatedDocument, _, err := service.documentRepository.UpdateDocumentContentByIDAndUserID(
		ctx,
		documentID,
		userID,
		request.Content,
		saveMode == dto.DocumentContentSaveModeManual,
	)
	if err != nil {
		return nil, err
	}

	documentDetail, err := service.toDocumentDetailResponseData(ctx, userID, *updatedDocument)
	if err != nil {
		return nil, err
	}

	return &dto.UpdateDocumentContentResponse{
		Document: documentDetail,
	}, nil
}

func (service *documentService) ListDocumentRevisions(
	ctx context.Context,
	userID int64,
	documentID int64,
) (*dto.ListDocumentRevisionsResponse, error) {
	if documentID <= 0 {
		return nil, appconst.ErrInvalidParams
	}

	if _, err := service.documentRepository.FindDocumentByIDAndUserID(ctx, documentID, userID); err != nil {
		return nil, err
	}

	revisions, err := service.documentRepository.ListDocumentRevisionsByDocumentIDAndUserID(
		ctx,
		documentID,
		userID,
		documentRevisionListLimit,
	)
	if err != nil {
		return nil, err
	}

	currentContentHasRevision, err := service.documentRepository.CurrentDocumentContentHasRevisionByDocumentIDAndUserID(
		ctx,
		documentID,
		userID,
	)
	if err != nil {
		return nil, err
	}

	response := &dto.ListDocumentRevisionsResponse{
		Revisions:             make([]dto.DocumentRevisionSummaryResponse, 0, len(revisions)),
		HasUnversionedContent: !currentContentHasRevision,
	}
	for _, revision := range revisions {
		response.Revisions = append(response.Revisions, toDocumentRevisionSummary(revision))
	}

	return response, nil
}

func (service *documentService) GetDocumentRevisionDiff(
	ctx context.Context,
	userID int64,
	documentID int64,
	request dto.DocumentRevisionDiffRequest,
) (*dto.GetDocumentRevisionDiffResponse, error) {
	if documentID <= 0 || request.FromRevisionID <= 0 || request.ToRevisionID <= 0 {
		return nil, appconst.ErrInvalidParams
	}

	if _, err := service.documentRepository.FindDocumentByIDAndUserID(ctx, documentID, userID); err != nil {
		return nil, err
	}

	fromRevision, err := service.documentRepository.FindDocumentRevisionByIDAndDocumentIDAndUserID(
		ctx,
		request.FromRevisionID,
		documentID,
		userID,
	)
	if err != nil {
		return nil, err
	}

	toRevision, err := service.documentRepository.FindDocumentRevisionByIDAndDocumentIDAndUserID(
		ctx,
		request.ToRevisionID,
		documentID,
		userID,
	)
	if err != nil {
		return nil, err
	}

	diffResult := util.BuildTextDiff(fromRevision.SnapshotContent, toRevision.SnapshotContent)
	response := &dto.GetDocumentRevisionDiffResponse{
		Diff: dto.DocumentRevisionDiffResponseData{
			FromRevision: toDocumentRevisionSummary(*fromRevision),
			ToRevision:   toDocumentRevisionSummary(*toRevision),
			Stats: dto.DocumentRevisionDiffStatsResponse{
				AddedLines:     diffResult.Stats.AddedLines,
				DeletedLines:   diffResult.Stats.DeletedLines,
				UnchangedLines: diffResult.Stats.UnchangedLines,
			},
			Lines: make([]dto.DocumentRevisionDiffLineResponse, 0, len(diffResult.Lines)),
		},
	}

	for _, diffLine := range diffResult.Lines {
		response.Diff.Lines = append(response.Diff.Lines, toDocumentRevisionDiffLine(diffLine))
	}

	return response, nil
}

func (service *documentService) RollbackDocumentRevision(
	ctx context.Context,
	userID int64,
	documentID int64,
	revisionID int64,
) (*dto.RollbackDocumentRevisionResponse, error) {
	if documentID <= 0 || revisionID <= 0 {
		return nil, appconst.ErrInvalidParams
	}

	document, revision, rolledBack, err := service.documentRepository.RollbackDocumentToRevisionByIDAndUserID(
		ctx,
		documentID,
		userID,
		revisionID,
	)
	if err != nil {
		return nil, err
	}

	documentDetail, err := service.toDocumentDetailResponseData(ctx, userID, *document)
	if err != nil {
		return nil, err
	}

	return &dto.RollbackDocumentRevisionResponse{
		Document:   documentDetail,
		Revision:   toDocumentRevisionSummary(*revision),
		RolledBack: rolledBack,
	}, nil
}

func (service *documentService) toDocumentDetailResponseData(
	ctx context.Context,
	userID int64,
	document model.Document,
) (dto.DocumentDetailResponseData, error) {
	currentContentHasRevision, err := service.documentRepository.CurrentDocumentContentHasRevisionByDocumentIDAndUserID(
		ctx,
		document.ID,
		userID,
	)
	if err != nil {
		return dto.DocumentDetailResponseData{}, err
	}

	return dto.DocumentDetailResponseData{
		ID:                    document.ID,
		FolderID:              document.FolderID,
		Title:                 document.Title,
		Content:               document.Content,
		HasUnversionedContent: !currentContentHasRevision,
		CreatedAt:             document.CreatedAt,
		UpdatedAt:             document.UpdatedAt,
	}, nil
}

func toDocumentRevisionSummary(revision model.DocumentRevision) dto.DocumentRevisionSummaryResponse {
	return dto.DocumentRevisionSummaryResponse{
		ID:               revision.ID,
		RevisionNumber:   revision.RevisionNumber,
		Operation:        dto.DocumentRevisionOperation(revision.Operation),
		ContentSize:      revision.ContentSize,
		Preview:          util.BuildDocumentRevisionPreview(revision.SnapshotContent),
		SourceRevisionID: revision.SourceRevisionID,
		CreatedAt:        revision.CreatedAt,
	}
}

func toDocumentRevisionDiffLine(diffLine util.TextDiffLine) dto.DocumentRevisionDiffLineResponse {
	var oldLineNumber *int
	var newLineNumber *int

	if diffLine.OldLineNumber > 0 {
		oldLineNumber = &diffLine.OldLineNumber
	}
	if diffLine.NewLineNumber > 0 {
		newLineNumber = &diffLine.NewLineNumber
	}

	return dto.DocumentRevisionDiffLineResponse{
		Type:          dto.DocumentRevisionDiffLineType(diffLine.Operation),
		Content:       diffLine.Content,
		OldLineNumber: oldLineNumber,
		NewLineNumber: newLineNumber,
	}
}

func toDocumentSearchSummary(document model.Document, keyword string, folderName string) dto.DocumentSearchSummaryResponse {
	matchSources := util.BuildSearchMatchSources(document.Title, document.Content, keyword)

	return dto.DocumentSearchSummaryResponse{
		ID:           document.ID,
		FolderID:     document.FolderID,
		FolderName:   folderName,
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

func (service *documentService) listFolderNamesByUserID(ctx context.Context, userID int64) (map[int64]string, error) {
	folders, err := service.folderRepository.ListFoldersByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	folderNameMap := make(map[int64]string, len(folders))
	for _, folder := range folders {
		folderNameMap[folder.ID] = folder.Name
	}

	return folderNameMap, nil
}

func resolveSearchResultFolderName(folderID *int64, currentFolderName string, folderNameMap map[int64]string) string {
	if folderID == nil {
		return rootFolderDisplayName
	}

	if currentFolderName != "" && currentFolderName != rootFolderDisplayName {
		return currentFolderName
	}

	if folderName, exists := folderNameMap[*folderID]; exists {
		return folderName
	}

	return unknownFolderDisplayName
}
