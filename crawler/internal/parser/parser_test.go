package parser

import (
	"os"
	"testing"
)

func TestParseQuestionsExtractsNumbersChoicesAnswersAndExplanation(t *testing.T) {
	body, err := os.ReadFile("../../testdata/krdump-page.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	questions, err := ParseQuestions("sap-c02", body)
	if err != nil {
		t.Fatalf("ParseQuestions returned error: %v", err)
	}
	if len(questions) != 4 {
		t.Fatalf("questions len = %d, want 4", len(questions))
	}
	if questions[0].Number != 1 || questions[0].Text == "" {
		t.Fatalf("first question = %+v", questions[0])
	}
	if len(questions[0].Choices) != 3 {
		t.Fatalf("first choices len = %d, want 3", len(questions[0].Choices))
	}
	if questions[2].AnswerKey[0] != "A" || questions[2].AnswerKey[1] != "B" {
		t.Fatalf("third answer key = %v, want [A B]", questions[2].AnswerKey)
	}
	if questions[0].Explanation == nil || *questions[0].Explanation == "" {
		t.Fatalf("first explanation = %v, want text", questions[0].Explanation)
	}
	if len(questions[3].Choices) != 1 {
		t.Fatalf("fourth choices len = %d, want 1", len(questions[3].Choices))
	}
}

func TestValidatePageQuestionRangeAllowsLastPage476(t *testing.T) {
	if err := ValidatePageQuestionRange(2, []int{1, 2, 3, 4, 5}); err != nil {
		t.Fatalf("ValidatePageQuestionRange page 2 returned error: %v", err)
	}
	if err := ValidatePageQuestionRange(97, []int{476}); err != nil {
		t.Fatalf("ValidatePageQuestionRange page 97 returned error: %v", err)
	}
	if err := ValidatePageQuestionRange(3, []int{11}); err == nil {
		t.Fatal("ValidatePageQuestionRange returned nil, want range error")
	}
}
