import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  ExperienceEntry,
  EducationEntry,
  SkillCategory,
  CertificationEntry,
  ProjectEntry,
  SocialLink,
} from "@/types/content";

/** Single-row draft table — admin edits this freely, publish() copies it into publishedSnapshot. */
export const portfolio = pgTable("portfolio", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull().default(""),
  heroSubtitle: text("hero_subtitle").notNull().default(""),
  aboutBio: text("about_bio").notNull().default(""),
  experience: jsonb("experience").$type<ExperienceEntry[]>().notNull().default([]),
  education: jsonb("education").$type<EducationEntry[]>().notNull().default([]),
  skills: jsonb("skills").$type<SkillCategory[]>().notNull().default([]),
  certifications: jsonb("certifications").$type<CertificationEntry[]>().notNull().default([]),
  projects: jsonb("projects").$type<ProjectEntry[]>().notNull().default([]),
  social: jsonb("social").$type<SocialLink[]>().notNull().default([]),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  duetWithPhotoId: integer("duet_with_photo_id"),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  attribution: text("attribution"),
  emphasis: integer("emphasis").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  description: text("description").notNull().default(""),
  body: text("body").notNull().default(""),
});

/** What the public site actually reads. Written only by the global publish() action. */
export const publishedSnapshot = pgTable("published_snapshot", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});
