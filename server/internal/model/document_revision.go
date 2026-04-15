// document_revision.go - 定义 document_revisions 表对应的数据模型
package model

import "time"

// DocumentRevisionOperation - 文档历史版本的生成来源。
type DocumentRevisionOperation string

const (
	DocumentRevisionOperationCreate   DocumentRevisionOperation = "create"
	DocumentRevisionOperationUpdate   DocumentRevisionOperation = "update"
	DocumentRevisionOperationRollback DocumentRevisionOperation = "rollback"
	DocumentRevisionOperationSeed     DocumentRevisionOperation = "seed"
)

// DocumentRevision - 文档历史版本表数据模型。
type DocumentRevision struct {
	ID              int64
	DocumentID      int64
	RevisionNumber  int64
	SnapshotContent string
	ContentSize     int
	Operation       DocumentRevisionOperation
	SourceRevisionID *int64
	CreatedAt       time.Time
}
