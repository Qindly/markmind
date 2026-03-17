// document_dto.go - 定义文档详情、历史版本与正文保存相关的请求响应结构体
package dto

import "time"

// DocumentDetailResponseData - 文档详情数据。
type DocumentDetailResponseData struct {
	ID                    int64     `json:"id"`
	FolderID              *int64    `json:"folder_id"`
	Title                 string    `json:"title"`
	Content               string    `json:"content"`
	HasUnversionedContent bool      `json:"has_unversioned_content"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// GetDocumentDetailResponse - 获取文档详情返回数据。
type GetDocumentDetailResponse struct {
	Document DocumentDetailResponseData `json:"document"`
}

// UpdateDocumentContentRequest - 更新文档正文请求体。
type UpdateDocumentContentRequest struct {
	Content  string                  `json:"content"`
	SaveMode DocumentContentSaveMode `json:"save_mode"`
}

// UpdateDocumentContentResponse - 更新文档正文返回数据。
type UpdateDocumentContentResponse struct {
	Document DocumentDetailResponseData `json:"document"`
}

// DocumentContentSaveMode - 文档正文保存模式。
type DocumentContentSaveMode string

const (
	DocumentContentSaveModeAuto   DocumentContentSaveMode = "auto"
	DocumentContentSaveModeManual DocumentContentSaveMode = "manual"
)

// NormalizeDocumentContentSaveMode - 对空保存模式兜底为 manual，兼容旧客户端。
func NormalizeDocumentContentSaveMode(mode DocumentContentSaveMode) DocumentContentSaveMode {
	if mode == "" {
		return DocumentContentSaveModeManual
	}

	return mode
}

// IsValidDocumentContentSaveMode - 校验保存模式是否合法。
func IsValidDocumentContentSaveMode(mode DocumentContentSaveMode) bool {
	return mode == DocumentContentSaveModeAuto || mode == DocumentContentSaveModeManual
}

// DocumentRevisionOperation - 文档历史版本的生成来源。
type DocumentRevisionOperation string

const (
	DocumentRevisionOperationCreate   DocumentRevisionOperation = "create"
	DocumentRevisionOperationUpdate   DocumentRevisionOperation = "update"
	DocumentRevisionOperationRollback DocumentRevisionOperation = "rollback"
	DocumentRevisionOperationSeed     DocumentRevisionOperation = "seed"
)

// DocumentRevisionSummaryResponse - 文档历史版本摘要。
type DocumentRevisionSummaryResponse struct {
	ID               int64                     `json:"id"`
	RevisionNumber   int64                     `json:"revision_number"`
	Operation        DocumentRevisionOperation `json:"operation"`
	ContentSize      int                       `json:"content_size"`
	Preview          string                    `json:"preview"`
	SourceRevisionID *int64                    `json:"source_revision_id"`
	CreatedAt        time.Time                 `json:"created_at"`
}

// ListDocumentRevisionsResponse - 文档历史版本列表返回数据。
type ListDocumentRevisionsResponse struct {
	Revisions             []DocumentRevisionSummaryResponse `json:"revisions"`
	HasUnversionedContent bool                              `json:"has_unversioned_content"`
}

// DocumentRevisionDiffRequest - 查询两个历史版本差异的参数。
type DocumentRevisionDiffRequest struct {
	FromRevisionID int64
	ToRevisionID   int64
}

// DocumentRevisionDiffLineType - 单行 diff 的变更类型。
type DocumentRevisionDiffLineType string

const (
	DocumentRevisionDiffLineTypeEqual  DocumentRevisionDiffLineType = "equal"
	DocumentRevisionDiffLineTypeInsert DocumentRevisionDiffLineType = "insert"
	DocumentRevisionDiffLineTypeDelete DocumentRevisionDiffLineType = "delete"
)

// DocumentRevisionDiffLineResponse - 单行 diff 结果。
type DocumentRevisionDiffLineResponse struct {
	Type          DocumentRevisionDiffLineType `json:"type"`
	Content       string                       `json:"content"`
	OldLineNumber *int                         `json:"old_line_number"`
	NewLineNumber *int                         `json:"new_line_number"`
}

// DocumentRevisionDiffStatsResponse - diff 统计信息。
type DocumentRevisionDiffStatsResponse struct {
	AddedLines     int `json:"added_lines"`
	DeletedLines   int `json:"deleted_lines"`
	UnchangedLines int `json:"unchanged_lines"`
}

// DocumentRevisionDiffResponseData - 两个历史版本之间的 diff 结果。
type DocumentRevisionDiffResponseData struct {
	FromRevision DocumentRevisionSummaryResponse    `json:"from_revision"`
	ToRevision   DocumentRevisionSummaryResponse    `json:"to_revision"`
	Stats        DocumentRevisionDiffStatsResponse  `json:"stats"`
	Lines        []DocumentRevisionDiffLineResponse `json:"lines"`
}

// GetDocumentRevisionDiffResponse - 历史版本 diff 返回数据。
type GetDocumentRevisionDiffResponse struct {
	Diff DocumentRevisionDiffResponseData `json:"diff"`
}

// RollbackDocumentRevisionResponse - 历史版本回滚返回数据。
type RollbackDocumentRevisionResponse struct {
	Document   DocumentDetailResponseData      `json:"document"`
	Revision   DocumentRevisionSummaryResponse `json:"revision"`
	RolledBack bool                            `json:"rolled_back"`
}

// SearchDocumentsRequest - 按关键字搜索文档的请求参数。
type SearchDocumentsRequest struct {
	Keyword  string
	FolderID *int64
	Scope    DocumentSearchScope
}

// DocumentSearchScope - 表示文档搜索的范围。
type DocumentSearchScope string

const (
	// DocumentSearchScopeCurrentFolder - 表示只搜索当前目录。
	DocumentSearchScopeCurrentFolder DocumentSearchScope = "current_folder"
	// DocumentSearchScopeGlobal - 表示搜索当前用户的全部文档。
	DocumentSearchScopeGlobal DocumentSearchScope = "global"
)

// DocumentSearchMatchSource - 文档搜索结果命中来源类型。
type DocumentSearchMatchSource string

const (
	// DocumentSearchMatchSourceTitle - 表示关键字命中了文档标题。
	DocumentSearchMatchSourceTitle DocumentSearchMatchSource = "title"
	// DocumentSearchMatchSourceContent - 表示关键字命中了文档正文。
	DocumentSearchMatchSourceContent DocumentSearchMatchSource = "content"
)

// DocumentSearchSummaryResponse - 文档搜索结果列表项。
type DocumentSearchSummaryResponse struct {
	ID           int64                       `json:"id"`
	FolderID     *int64                      `json:"folder_id"`
	FolderName   string                      `json:"folder_name"`
	Title        string                      `json:"title"`
	Snippet      string                      `json:"snippet"`
	MatchSources []DocumentSearchMatchSource `json:"match_sources"`
	CreatedAt    time.Time                   `json:"created_at"`
	UpdatedAt    time.Time                   `json:"updated_at"`
}

// SearchDocumentsResponse - 文档搜索返回数据。
type SearchDocumentsResponse struct {
	Documents []DocumentSearchSummaryResponse `json:"documents"`
}
