package pool

import (
	"encoding/json"
	"testing"
)

func TestExamQuestionMatchesAPISchema(t *testing.T) {
	explanation := "해설"
	exam := Exam{
		Slug:        "sap-c02",
		DisplayName: "AWS SAP-C02",
		Version:     "v2025-11-26.q476",
		CrawledAt:   "2026-05-26T00:00:00Z",
		Questions: []Question{{
			ExamSlug: "sap-c02",
			Number:   1,
			Text:     "문제",
			Choices:  []Choice{{Label: "A", Text: "선택지"}},
			AnswerKey: []string{
				"A",
			},
			Explanation: &explanation,
		}},
	}

	body, err := json.Marshal(exam)
	if err != nil {
		t.Fatalf("marshal exam: %v", err)
	}

	var decoded struct {
		Questions []struct {
			ExamSlug    string   `json:"examSlug"`
			Number      int      `json:"number"`
			Text        string   `json:"text"`
			Choices     []Choice `json:"choices"`
			AnswerKey   []string `json:"answerKey"`
			Explanation *string  `json:"explanation"`
		} `json:"questions"`
	}
	if err := json.Unmarshal(body, &decoded); err != nil {
		t.Fatalf("unmarshal exam: %v", err)
	}
	got := decoded.Questions[0]
	if got.ExamSlug != "sap-c02" || got.Number != 1 || got.Text == "" {
		t.Fatalf("decoded question = %+v", got)
	}
	if len(got.Choices) != 1 {
		t.Fatalf("choices len = %d, want 1", len(got.Choices))
	}
	if got.Explanation == nil || *got.Explanation != "해설" {
		t.Fatalf("explanation = %v, want 해설", got.Explanation)
	}
}

func TestValidateExamAllowsSingleChoiceAndRejectsBadAnswer(t *testing.T) {
	exam := Exam{
		Slug:        "sap-c02",
		DisplayName: "AWS SAP-C02",
		Version:     "v2025-11-26.q476",
		CrawledAt:   "2026-05-26T00:00:00Z",
		Questions: []Question{{
			ExamSlug:  "sap-c02",
			Number:    476,
			Text:      "문제",
			Choices:   []Choice{{Label: "A", Text: "선택지"}},
			AnswerKey: []string{"A"},
		}},
	}

	if err := ValidateExam(exam); err != nil {
		t.Fatalf("ValidateExam returned error: %v", err)
	}

	exam.Questions[0].AnswerKey = []string{"B"}
	if err := ValidateExam(exam); err == nil {
		t.Fatal("ValidateExam returned nil, want bad answer error")
	}
}

func TestMergePagesSortsAndDedupes(t *testing.T) {
	pages := []Page{
		{Page: 3, Questions: []Question{{ExamSlug: "sap-c02", Number: 6, Text: "six", Choices: []Choice{{Label: "A", Text: "a"}}, AnswerKey: []string{"A"}}}},
		{Page: 2, Questions: []Question{{ExamSlug: "sap-c02", Number: 1, Text: "one", Choices: []Choice{{Label: "A", Text: "a"}}, AnswerKey: []string{"A"}}}},
		{Page: 2, Questions: []Question{{ExamSlug: "sap-c02", Number: 1, Text: "one replacement", Choices: []Choice{{Label: "A", Text: "a"}}, AnswerKey: []string{"A"}}}},
	}

	exam, err := MergePages("sap-c02", "AWS SAP-C02", "v2025-11-26.q476", "2026-05-26T00:00:00Z", pages)
	if err != nil {
		t.Fatalf("MergePages returned error: %v", err)
	}
	if len(exam.Questions) != 2 {
		t.Fatalf("questions len = %d, want 2", len(exam.Questions))
	}
	if exam.Questions[0].Number != 1 || exam.Questions[0].Text != "one replacement" {
		t.Fatalf("first question = %+v", exam.Questions[0])
	}
	if exam.Questions[1].Number != 6 {
		t.Fatalf("second question number = %d, want 6", exam.Questions[1].Number)
	}
}
