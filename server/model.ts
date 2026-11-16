import { z } from "zod";
const text = z.string().max(10000),
  short = z.string().max(200),
  id = z.uuid();
const money = z.number().int().min(0).max(1_000_000_000_000);
const date = z.iso.date();
export const projectSchema = z
  .object({ description: text, intro: text, currentSeasonId: id.nullable() })
  .strict();
export const seasonSchema = z
  .object({
    ordinal: z.number().int().min(1).max(100),
    title: short.min(1),
    durationMonths: z.number().int().min(1).max(120).nullable(),
    objective: text,
    status: z.enum([
      "draft",
      "fundraising",
      "fully_funded",
      "active",
      "completed",
      "archived",
    ]),
    fundingGoal: money.nullable(),
    plannedLessons: z.number().int().min(0).max(10000).nullable(),
    lessonLow: money.nullable(),
    lessonHigh: money.nullable(),
    equipmentBudget: money.nullable(),
    contingency: money,
    shareFinance: z.boolean(),
    currentStageId: id.nullable().default(null),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.ordinal === 1 && v.durationMonths !== 24)
      c.addIssue({ code: "custom", message: "Season 1 must remain 24 months" });
    if (
      v.lessonHigh !== null &&
      v.lessonLow !== null &&
      v.lessonHigh < v.lessonLow
    )
      c.addIssue({ code: "custom", message: "Lesson range is reversed" });
  });
const base = { seasonId: id };
export const schemas = {
  stages: z
    .object({
      ...base,
      title: short.min(1),
      order: z.number().int().min(1).max(100),
      period: short,
      goal: text,
      activities: z.array(short).max(30),
      checkpoint: text,
      short: short,
      icon: z.string().max(4),
    })
    .strict(),
  skills: z
    .object({
      ...base,
      code: z.string().regex(/^[A-F]-\d{2,3}$/),
      group: z.enum(["A", "B", "C", "D", "E", "F"]),
      title: short.min(1),
      stage: z.number().int().min(1).max(100),
      goal: text,
      practice: text,
      pass: text,
      teacher: text,
      prerequisites: z.array(id).max(50),
      duration: short,
      status: z
        .enum(["LEARNING", "PRACTICING", "HOME_READY", "TEACHER_PASS"])
        .nullable(),
      teacherFeedback: text,
      teacherApproved: z.boolean(),
    })
    .strict(),
  lessons: z
    .object({
      ...base,
      date,
      attendance: z.enum(["planned", "attended", "absent", "cancelled"]),
      cost: money.nullable(),
      skillsTaught: z.array(id).max(50),
      skillsCorrect: z.array(id).max(50),
      homework: text,
      teacherComments: text,
      nextLesson: date.nullable(),
    })
    .strict(),
  practices: z
    .object({
      ...base,
      date,
      skillIds: z.array(id).max(50),
      minutes: z.number().int().min(0).max(120).nullable(),
      notes: text,
    })
    .strict(),
  journal: z
    .object({
      ...base,
      title: short.min(1),
      description: text,
      stageId: id.nullable(),
      date,
      tags: z.array(short).max(20),
      kind: z.enum(["Video luyện tập", "Bài học", "Cột mốc"]),
      visibility: z.enum(["PARENT", "FAMILY", "PUBLIC"]),
      published: z.boolean(),
    })
    .strict(),
  contributions: z
    .object({
      ...base,
      date,
      kind: z.enum(["gift", "in_kind"]),
      amount: money.nullable(),
      description: text,
      supporterPrivate: short,
      status: z.enum(["pending", "confirmed", "void"]),
      publicAcknowledgement: z.boolean(),
    })
    .strict()
    .superRefine((v, c) => {
      if (v.kind === "gift" && v.amount === null)
        c.addIssue({ code: "custom", message: "Cash gifts require an amount" });
      if (v.kind === "in_kind" && v.amount !== null)
        c.addIssue({
          code: "custom",
          message: "In-kind gifts have no cash value in totals",
        });
    }),
  expenses: z
    .object({
      ...base,
      date,
      amount: money,
      category: z.enum(["lesson", "equipment", "other"]),
      description: text,
      status: z.enum(["recorded", "void"]),
      lessonId: id.nullable(),
    })
    .strict(),
};
export type Kind = keyof typeof schemas;
export function totals(season: any, contributions: any[], expenses: any[]) {
  const received = contributions
    .filter((x) => x.status === "confirmed" && x.kind === "gift")
    .reduce((a, x) => a + x.amount, 0);
  const spent = expenses
    .filter((x) => x.status === "recorded")
    .reduce((a, x) => a + x.amount, 0);
  return {
    goal: season.fundingGoal,
    received,
    spent,
    balance: received - spent,
    unfunded:
      season.fundingGoal === null
        ? null
        : Math.max(0, season.fundingGoal - received),
    targetReached:
      season.fundingGoal === null ? null : received >= season.fundingGoal,
    lessonEstimateLow:
      season.plannedLessons === null || season.lessonLow === null
        ? null
        : season.plannedLessons * season.lessonLow,
    lessonEstimateHigh:
      season.plannedLessons === null || season.lessonHigh === null
        ? null
        : season.plannedLessons * season.lessonHigh,
    equipmentBudget: season.equipmentBudget,
    contingency: season.contingency,
  };
}
