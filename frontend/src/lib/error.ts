import { errorEnvelopeSchema, type ErrorEnvelope } from "../api/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly envelope: ErrorEnvelope,
  ) {
    super(envelope.message);
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const fallback = {
    code: "INTERNAL",
    message: "요청을 처리하지 못했습니다.",
    requestId: response.headers.get("X-Request-Id") ?? "unknown",
  } as const;
  const body = await response.json().catch(() => fallback);
  return new ApiError(response.status, errorEnvelopeSchema.catch(fallback).parse(body));
}
