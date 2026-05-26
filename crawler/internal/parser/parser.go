package parser

import (
	"bytes"
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"young-certi/crawler/internal/pool"
)

var (
	numberRE = regexp.MustCompile(`(?i)(?:질문|문제|question|#)\s*#?\s*(\d+)`)
	choiceRE = regexp.MustCompile(`(?m)^\s*([A-H])[\.)]\s*(.+)$`)
	answerRE = regexp.MustCompile(`(?i)(?:정답|answer)\s*[:：]\s*([A-H](?:\s*[,/]\s*[A-H])*)`)
)

func ParseQuestions(examSlug string, body []byte) ([]pool.Question, error) {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("parse html: %w", err)
	}
	var questions []pool.Question
	doc.Find(".qa_block, .qa-item, .question, .qa").Each(func(_ int, s *goquery.Selection) {
		q, err := parseBlock(examSlug, s)
		if err == nil {
			questions = append(questions, q)
		}
	})
	if len(questions) == 0 {
		doc.Find(".qa_question").Each(func(_ int, s *goquery.Selection) {
			q, err := parseBlock(examSlug, s.Parent())
			if err == nil {
				questions = append(questions, q)
			}
		})
	}
	if len(questions) == 0 {
		return nil, fmt.Errorf("no questions parsed")
	}
	sort.Slice(questions, func(i, j int) bool {
		return questions[i].Number < questions[j].Number
	})
	return questions, nil
}

func parseBlock(examSlug string, s *goquery.Selection) (pool.Question, error) {
	questionText := cleanText(firstText(s, ".qa-question, .qa_question, .question-title"))
	if questionText == "" {
		return pool.Question{}, fmt.Errorf("question text is empty")
	}
	numberText := firstText(s, "h4, h3, h2")
	number, err := parseNumber(numberText + " " + questionText)
	if err != nil {
		return pool.Question{}, err
	}
	choices := parseChoices(s)
	if len(choices) == 0 {
		return pool.Question{}, fmt.Errorf("choices are empty")
	}
	answerKey, err := parseAnswer(firstText(s, ".qa-answerexp, .qa_answer, .answer, .correct-answer"))
	if err != nil {
		return pool.Question{}, err
	}
	explanationText := cleanText(firstText(s, ".qa_explanation, .explanation"))
	var explanation *string
	if explanationText != "" {
		explanation = &explanationText
	}
	return pool.Question{
		ExamSlug:    examSlug,
		Number:      number,
		Text:        stripNumberPrefix(questionText),
		Choices:     choices,
		AnswerKey:   answerKey,
		Explanation: explanation,
	}, nil
}

func firstText(s *goquery.Selection, selector string) string {
	text := ""
	s.Find(selector).First().Each(func(_ int, found *goquery.Selection) {
		text = found.Text()
	})
	return text
}

func parseNumber(text string) (int, error) {
	match := numberRE.FindStringSubmatch(text)
	if len(match) != 2 {
		return 0, fmt.Errorf("question number not found")
	}
	var number int
	if _, err := fmt.Sscanf(match[1], "%d", &number); err != nil {
		return 0, fmt.Errorf("parse question number: %w", err)
	}
	return number, nil
}

func parseChoices(s *goquery.Selection) []pool.Choice {
	var choices []pool.Choice
	s.Find(".qa-options li, .qa-options p, .qa_options li, .qa_options p, .options li, .answers li").Each(func(_ int, found *goquery.Selection) {
		if choice, ok := parseChoiceLine(found.Text()); ok {
			choices = append(choices, choice)
		}
	})
	if len(choices) > 0 {
		return choices
	}
	for _, line := range strings.Split(s.Text(), "\n") {
		if choice, ok := parseChoiceLine(line); ok {
			choices = append(choices, choice)
		}
	}
	return choices
}

func parseChoiceLine(line string) (pool.Choice, bool) {
	line = cleanText(line)
	match := choiceRE.FindStringSubmatch(line)
	if len(match) != 3 {
		return pool.Choice{}, false
	}
	return pool.Choice{Label: strings.ToUpper(match[1]), Text: strings.TrimSpace(match[2])}, true
}

func parseAnswer(text string) ([]string, error) {
	match := answerRE.FindStringSubmatch(cleanText(text))
	if len(match) != 2 {
		return nil, fmt.Errorf("answer not found")
	}
	raw := strings.NewReplacer("/", ",", " ", "").Replace(match[1])
	parts := strings.Split(raw, ",")
	answers := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.ToUpper(strings.TrimSpace(part))
		if part != "" {
			answers = append(answers, part)
		}
	}
	if len(answers) == 0 {
		return nil, fmt.Errorf("answer not found")
	}
	return answers, nil
}

func ValidatePageQuestionRange(page int, numbers []int) error {
	if page == 97 && len(numbers) == 1 && numbers[0] == 476 {
		return nil
	}
	start := (page-2)*5 + 1
	end := start + 4
	if len(numbers) == 0 {
		return fmt.Errorf("page %d: no question numbers", page)
	}
	for _, number := range numbers {
		if number < start || number > end {
			return fmt.Errorf("page %d: question %d outside expected range %d..%d", page, number, start, end)
		}
	}
	return nil
}

func cleanText(text string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(text)), " ")
}

func stripNumberPrefix(text string) string {
	text = numberRE.ReplaceAllString(text, "")
	text = strings.TrimLeft(text, " :：.-")
	return cleanText(text)
}
