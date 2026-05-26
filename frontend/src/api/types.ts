import { z } from "zod";

export const errorEnvelopeSchema = z.object({
  code: z.enum(["NOT_FOUND", "VALIDATION", "POOL_UNAVAILABLE", "INTERNAL"]),
  message: z.string(),
  details: z.record(z.unknown()).nullable().optional(),
  requestId: z.string(),
});

export const choiceSchema = z.object({
  label: z.string().min(1),
  text: z.string(),
});

export const questionSchema = z.object({
  examSlug: z.string(),
  number: z.number(),
  text: z.string(),
  choices: z.array(choiceSchema).min(1).max(8),
  answerKey: z.array(z.string()).min(1),
  explanation: z.string().nullable().optional(),
});

export const questionNumbersSchema = z.object({
  examSlug: z.string(),
  version: z.string(),
  total: z.number(),
  numbers: z.array(z.number()),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionNumbers = z.infer<typeof questionNumbersSchema>;

