import { z } from "zod";

export const CategoryEnum = z.enum([
  "HEALTH",
  "MINDSET",
  "PRODUCTIVITY",
  "SOCIAL",
  "FINANCE",
]);
export const GoalStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);
export const FrequencyEnum = z.enum(["DAILY", "WEEKLY"]);

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const goalCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  category: CategoryEnum.default("PRODUCTIVITY"),
  targetDate: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).default(0),
});

export const goalUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  category: CategoryEnum.optional(),
  targetDate: z.string().optional().nullable(),
  status: GoalStatusEnum.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  order: z.number().int().optional(),
});

export const habitCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  category: CategoryEnum.default("HEALTH"),
  frequency: FrequencyEnum.default("DAILY"),
});

export const habitUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  category: CategoryEnum.optional(),
  frequency: FrequencyEnum.optional(),
});

export const journalCreateSchema = z.object({
  content: z.string().min(1, "Write something first").max(10000),
  mood: z.number().int().min(1).max(5).default(3),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const journalUpdateSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(10000).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export const moodSchema = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string().max(500).optional().nullable(),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  avatar: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid hex colour")
    .optional(),
  emailDigest: z.boolean().optional(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE"),
});
