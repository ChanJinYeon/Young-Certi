import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChoiceList } from "../src/components/ChoiceList";
import { FavoriteToggle } from "../src/components/FavoriteToggle";
import { Pager } from "../src/components/Pager";
import { QuestionSetPicker } from "../src/components/QuestionSetPicker";
import { ResultFeedback } from "../src/components/ResultFeedback";
import { SideMenu } from "../src/components/SideMenu";
import { StudyTwoPane } from "../src/components/StudyTwoPane";
import { Toast } from "../src/components/Toast";
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

  it("renders a flush-left grid-rows shell with a fixed full-width top bar", () => {
    render(
      <StudyTwoPane
        sidebar={<nav aria-label="문제 목록">문제 번호</nav>}
        topBar={<h1>문제 풀이</h1>}
      >
        <article>문제 본문</article>
      </StudyTwoPane>,
    );

    expect(screen.getByRole("navigation", { name: "문제 목록" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제 풀이" })).toBeInTheDocument();
    expect(screen.getByText("문제 본문")).toBeInTheDocument();
    expect(screen.getByTestId("study-two-pane-shell")).toHaveClass("w-full");
    expect(screen.getByTestId("study-two-pane-shell")).toHaveClass(
      "grid-rows-[3.5rem_auto_minmax(0,1fr)]",
      "lg:grid-cols-[15rem_minmax(0,1fr)]",
      "lg:grid-rows-[3.5rem_minmax(0,1fr)]",
    );
    expect(screen.getByTestId("study-two-pane-shell")).not.toHaveClass("mx-auto");
    expect(screen.getByTestId("study-two-pane-shell")).not.toHaveClass("max-w-6xl");
    expect(screen.getByTestId("study-two-pane-top-bar")).toHaveClass(
      "col-span-full",
      "row-start-1",
      "h-14",
      "overflow-visible",
    );
    expect(screen.getByTestId("study-two-pane-top-bar")).not.toHaveClass("sticky", "top-0", "min-h-14");
    expect(screen.getByTestId("study-two-pane-sidebar")).toHaveClass("row-start-2", "lg:col-start-1");
    expect(screen.getByTestId("study-two-pane-sidebar")).not.toHaveClass("lg:row-span-2");
    expect(screen.getByTestId("study-two-pane-content")).toHaveClass("row-start-3", "lg:col-start-2", "lg:row-start-2");
  });

  it("renders a centered pager in previous-current-total-next order with bounds", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    const { rerender } = render(
      <Pager current={1} total={2} onPrev={onPrev} onNext={onNext} prevDisabled nextDisabled={false} />,
    );

    const pager = screen.getByRole("group", { name: "문제 이동" });
    expect(within(pager).getByRole("button", { name: "이전" })).toBeDisabled();
    expect(within(pager).getByText("1 / 2")).toBeInTheDocument();
    expect(within(pager).getByRole("button", { name: "다음" })).toBeEnabled();
    expect(pager.textContent).toMatch(/이전\s*1 \/ 2\s*다음/);

    await user.click(within(pager).getByRole("button", { name: "다음" }));
    expect(onNext).toHaveBeenCalledOnce();

    rerender(<Pager current={2} total={2} onPrev={onPrev} onNext={onNext} prevDisabled={false} nextDisabled />);
    expect(within(screen.getByRole("group", { name: "문제 이동" })).getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("renders a reusable status toast", () => {
    render(<Toast message="문제집에 추가했습니다." tone="success" onDismiss={() => undefined} />);

    expect(screen.getByRole("status")).toHaveTextContent("문제집에 추가했습니다.");
    expect(screen.getByRole("status")).toHaveClass("right-4", "top-4");
    expect(screen.getByRole("status")).not.toHaveClass("bottom-4", "left-1/2");
  });
});
