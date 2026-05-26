package uploader

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPutObjectSendsBodyToS3CompatibleEndpoint(t *testing.T) {
	var gotPath string
	var gotBody string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		body, _ := io.ReadAll(r.Body)
		gotBody = string(body)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client, err := NewS3Client(context.Background(), Config{
		EndpointURL: server.URL,
		Region:      "ap-northeast-2",
		AccessKeyID: "test",
		SecretKey:   "test",
	})
	if err != nil {
		t.Fatalf("NewS3Client returned error: %v", err)
	}
	if err := PutObject(context.Background(), client, "bucket", "sap-c02/questions.json", []byte(`{"ok":true}`)); err != nil {
		t.Fatalf("PutObject returned error: %v", err)
	}
	if gotPath != "/bucket/sap-c02/questions.json" {
		t.Fatalf("path = %q, want /bucket/sap-c02/questions.json", gotPath)
	}
	if gotBody != `{"ok":true}` {
		t.Fatalf("body = %q, want json", gotBody)
	}
}
