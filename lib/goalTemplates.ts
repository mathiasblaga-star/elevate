import type { Category } from "@prisma/client";

export interface GoalTemplate {
  key: string;
  title: string;
  category: Category;
  weeks: number;
  milestones: string[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    key: "fitness_month",
    title: "Fitness Month",
    category: "HEALTH",
    weeks: 4,
    milestones: [
      "Establish a 3x/week workout routine",
      "Add progressive overload to each session",
      "Dial in nutrition and sleep",
      "Hit a personal-best benchmark",
    ],
  },
  {
    key: "study_sprint",
    title: "Study Sprint",
    category: "PRODUCTIVITY",
    weeks: 4,
    milestones: [
      "Map the syllabus and set daily study blocks",
      "Complete core material and take notes",
      "Practice with past papers / exercises",
      "Full review and mock assessment",
    ],
  },
  {
    key: "mindfulness_reset",
    title: "Mindfulness Reset",
    category: "MINDSET",
    weeks: 4,
    milestones: [
      "Start a daily 5-minute meditation",
      "Add an evening journaling habit",
      "Reduce screen time before bed",
      "Reflect and set a sustainable routine",
    ],
  },
];

export const TEMPLATE_MAP = Object.fromEntries(GOAL_TEMPLATES.map((t) => [t.key, t]));
