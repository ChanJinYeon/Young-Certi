import { parseApiError } from "../lib/error";
import { questionNumbersSchema, questionSchema } from "./types";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseUrl =
  configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : window.location.hostname === "web"
      ? "http://api:8000"
      : "http://localhost:8000";

async function getJson<T>(path: string, parse: (value: unknown) => T): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return parse(await response.json());
}

export function fetchQuestionNumbers(examSlug: string) {
  return getJson(`/exams/${examSlug}/questions`, (value) => questionNumbersSchema.parse(value));
}

export function fetchQuestion(examSlug: string, number: number) {
  return getJson(`/exams/${examSlug}/questions/${number}`, (value) => questionSchema.parse(value));
}
