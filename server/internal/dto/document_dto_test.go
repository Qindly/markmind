package dto

import "testing"

func TestNormalizeDocumentContentSaveModeDefaultsToManual(t *testing.T) {
	if mode := NormalizeDocumentContentSaveMode(""); mode != DocumentContentSaveModeManual {
		t.Fatalf("empty save mode should default to manual, got %q", mode)
	}
}

func TestIsValidDocumentContentSaveMode(t *testing.T) {
	if !IsValidDocumentContentSaveMode(DocumentContentSaveModeAuto) {
		t.Fatal("auto save mode should be valid")
	}

	if !IsValidDocumentContentSaveMode(DocumentContentSaveModeManual) {
		t.Fatal("manual save mode should be valid")
	}

	if IsValidDocumentContentSaveMode("unexpected") {
		t.Fatal("unexpected save mode should be invalid")
	}
}
