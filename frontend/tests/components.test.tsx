import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChoiceList } from "../src/components/ChoiceList";
import { FavoriteToggle } from "../src/components/FavoriteToggle";
import { QuestionSetPicker } from "../src/components/QuestionSetPicker";
import { ResultFeedback } from "../src/components/ResultFeedback";
import { SideMenu } from "../src/components/SideMenu";
import type { Question } from "../src/api/types";

const question: Question = {
  examSlug: "sap-c02",
  number: 1,
  text: "Question?",
  choices: [
    { label: "A", text: "Amazon S3" },
    { label: "B", text: "Amazon RDS" },
    { label: "C", text: "Amazon EKS" },
  ],
  answerKey: ["A", "C"],
  explanation: "해설입니다.",
};

describe("practice components", () => {
  it("enforces single-answer radio behavior", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChoiceList
        choices={question.choices}
        answerKey={["A"]}
        selected={["A"]}
        submitted={false}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("B. Amazon RDS"));
    expect(onChange).toHaveBeenCalledWith(["B"]);
  });

  it("enforces multi-answer checkbox behavior", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ChoiceList
        choices={question.choices}
        answerKey={["A", "C"]}
        selected={["A"]}
        submitted={false}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("C. Amazon EKS"));
    expect(onChange).toHaveBeenCalledWith(["A", "C"]);
  });

  it("renders correct, incorrect, and missed-correct feedback", () => {
    render(<ResultFeedback question={question} selected={["A", "B"]} submitted />);

    expect(screen.getByText("정답 선택")).toBeInTheDocument();
    expect(screen.getByText("오답 선택")).toBeInTheDocument();
    expect(screen.getByText("놓친 정답")).toBeInTheDocument();
    expect(screen.getByText("해설입니다.")).toBeInTheDocument();
  });

  it("renders side menu markers and calls navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SideMenu
        numbers={[1, 2]}
        current={1}
        statuses={{ 2: "correct" }}
        favorites={new Set(["sap-c02:1"])}
        examSlug="sap-c02"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByLabelText("즐겨찾기 1")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "문제 2" }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("toggles favorite", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<FavoriteToggle active={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: "즐겨찾기 추가" }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("creates a question set from picker", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(<QuestionSetPicker sets={[]} onAdd={onAdd} onClose={() => undefined} />);

    await user.type(screen.getByLabelText("문제집 이름"), "Review");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onAdd).toHaveBeenCalledWith("Review");
  });
});

