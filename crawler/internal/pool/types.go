package pool

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
)

type Exam struct {
	Slug        string     `json:"slug"`
	DisplayName string     `json:"displayName"`
	Version     string     `json:"version"`
	CrawledAt   string     `json:"crawledAt"`
	Questions   []Question `json:"questions"`
}

type Question struct {
	ExamSlug    string   `json:"examSlug"`
	Number      int      `json:"number"`
	Text        string   `json:"text"`
	Choices     []Choice `json:"choices"`
	AnswerKey   []string `json:"answerKey"`
	Explanation *string  `json:"explanation"`
}

type Choice struct {
	Label string `json:"label"`
	Text  string `json:"text"`
}

type Page struct {
	Page      int        `json:"page"`
	Questions []Question `json:"questions"`
}

func ValidateExam(exam Exam) error {
	if exam.Slug == "" {
		return errors.New("exam slug is required")
	}
	seenNumbers := map[int]struct{}{}
	for _, q := range exam.Questions {
		if q.ExamSlug == "" {
			return fmt.Errorf("question %d: examSlug is required", q.Number)
		}
		if q.Number < 1 {
			return fmt.Errorf("question %d: number must be positive", q.Number)
		}
		if _, ok := seenNumbers[q.Number]; ok {
			return fmt.Errorf("question %d: duplicate number", q.Number)
		}
		seenNumbers[q.Number] = struct{}{}
		if q.Text == "" {
			return fmt.Errorf("question %d: text is required", q.Number)
		}
		if len(q.Choices) < 1 || len(q.Choices) > 8 {
			return fmt.Errorf("question %d: choices length must be 1..8", q.Number)
		}
		labels := map[string]struct{}{}
		for _, choice := range q.Choices {
			if choice.Label == "" || choice.Text == "" {
				return fmt.Errorf("question %d: choice label and text are required", q.Number)
			}
			if _, ok := labels[choice.Label]; ok {
				return fmt.Errorf("question %d: duplicate choice label %s", q.Number, choice.Label)
			}
			labels[choice.Label] = struct{}{}
		}
		if len(q.AnswerKey) < 1 {
			return fmt.Errorf("question %d: answerKey is required", q.Number)
		}
		for _, answer := range q.AnswerKey {
			if _, ok := labels[answer]; !ok {
				return fmt.Errorf("question %d: answer %s is not in choices", q.Number, answer)
			}
		}
	}
	return nil
}

func MergePages(slug, displayName, version, crawledAt string, pages []Page) (Exam, error) {
	byNumber := map[int]Question{}
	for _, page := range pages {
		for _, q := range page.Questions {
			byNumber[q.Number] = q
		}
	}
	numbers := make([]int, 0, len(byNumber))
	for number := range byNumber {
		numbers = append(numbers, number)
	}
	sort.Ints(numbers)
	questions := make([]Question, 0, len(numbers))
	for _, number := range numbers {
		questions = append(questions, byNumber[number])
	}
	exam := Exam{
		Slug:        slug,
		DisplayName: displayName,
		Version:     version,
		CrawledAt:   crawledAt,
		Questions:   questions,
	}
	return exam, ValidateExam(exam)
}

func WriteExam(path string, exam Exam) error {
	body, err := json.MarshalIndent(exam, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal exam: %w", err)
	}
	body = append(body, '\n')
	if err := os.WriteFile(path, body, 0o644); err != nil {
		return fmt.Errorf("write exam: %w", err)
	}
	return nil
}
