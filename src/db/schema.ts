import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["candidate", "recruiter"]);
export const matchStatusEnum = pgEnum("match_status", [
  "shortlist",
  "review",
  "reject",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("candidate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  rawText: text("raw_text").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  experienceYears: numeric("experience_years", {
    precision: 4,
    scale: 1,
  }).notNull().default("0"),
  education: varchar("education", { length: 120 }).notNull().default("Not specified"),
  atsScore: integer("ats_score").notNull().default(0),
  atsChecks: jsonb("ats_checks").$type<AtsCheck[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  recruiterId: uuid("recruiter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull().default(""),
  location: varchar("location", { length: 255 }).notNull().default("Remote"),
  description: text("description").notNull(),
  requiredSkills: jsonb("required_skills").$type<string[]>().notNull().default([]),
  preferredSkills: jsonb("preferred_skills").$type<string[]>().notNull().default([]),
  experienceYears: numeric("experience_years", {
    precision: 4,
    scale: 1,
  }).notNull().default("0"),
  education: varchar("education", { length: 120 }).notNull().default("Not specified"),
  responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  jobTitleSnapshot: varchar("job_title_snapshot", { length: 255 }).notNull(),
  overallScore: integer("overall_score").notNull(),
  skillScore: integer("skill_score").notNull(),
  experienceScore: integer("experience_score").notNull(),
  semanticScore: integer("semantic_score").notNull(),
  atsScore: integer("ats_score").notNull(),
  matchedSkills: jsonb("matched_skills").$type<SkillEvidence[]>().notNull().default([]),
  partialSkills: jsonb("partial_skills").$type<SkillEvidence[]>().notNull().default([]),
  missingSkills: jsonb("missing_skills").$type<string[]>().notNull().default([]),
  explanation: text("explanation").notNull(),
  status: matchStatusEnum("status").notNull().default("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 40 }).notNull(),
  original: text("original").notNull().default(""),
  suggestion: text("suggestion").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AtsCheck = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type SkillEvidence = {
  skill: string;
  detail: string;
};
