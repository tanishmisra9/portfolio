"use server";

import { eq, asc } from "drizzle-orm";
import matter from "gray-matter";
import { db } from "@/db/client";
import { portfolio, collections, photos, quotes, posts, radioTriggers } from "@/db/schema";
import {
  listAssetFilenames,
  uploadResume as uploadResumeBlob,
  uploadNamedAsset,
  listRadioSamples,
  deleteAsset,
} from "./blob";
import { findClosestMatch } from "./image-match";
import { publish as publishSnapshot } from "./publish";
import { isAllowedAudioFile } from "@/lib/radio-samples";
import type { PortfolioContent } from "@/types/content";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";

// Draft edits change whether there's anything to publish; refresh the admin layout so the header's Publish button reflects it.
function draftChanged() {
  revalidatePath("/admin", "layout");
}

// ---- Portfolio ----

export async function updatePortfolio(data: PortfolioContent) {
  await requireAdmin();
  await db
    .insert(portfolio)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: portfolio.id, set: data });
  draftChanged();
}

export async function getDraftPortfolio(): Promise<PortfolioContent | null> {
  await requireAdmin();
  const [row] = await db.select().from(portfolio);
  return row ?? null;
}

/** Returns the downloadUrl (serves with Content-Disposition: attachment) so the resume downloads with a clean filename cross-origin. */
export async function uploadResume(file: File, filename: string): Promise<string> {
  await requireAdmin();
  const blob = await uploadResumeBlob(file, filename);
  return blob.downloadUrl;
}

// ---- Radio easter-egg samples ----
// No draft/publish gating here — there's nothing to preview differently for a sound
// effect, so uploads/deletes take effect immediately via revalidating the root layout
// (getRadioSampleUrls is read there, shared by every route).

export async function listDraftRadioSamples() {
  await requireAdmin();
  return listRadioSamples();
}

/** Returns the uploaded blob's URL, or null if the file failed the audio check. */
export async function uploadRadioSample(file: File): Promise<string | null> {
  await requireAdmin();
  if (!isAllowedAudioFile(file.name, file.type)) return null;
  const blob = await uploadNamedAsset("radio", file, file.name);
  revalidatePath("/", "layout");
  return blob.url;
}

export async function deleteRadioSample(url: string) {
  await requireAdmin();
  await deleteAsset(url);
  revalidatePath("/", "layout");
}

// ---- Radio easter-egg keystroke triggers ----
// Same immediate-effect reasoning as the samples above. Triggers are validated against
// exactly what normalizeKey() in the listener can ever produce (lowercase a–z), so
// nothing that's saved here can be a silently-dead trigger.

function normalizeTrigger(raw: string): string {
  return raw.trim().toLowerCase();
}

function validateTrigger(text: string): string | null {
  if (text.length === 0) return "Enter a trigger.";
  if (!/^[a-z]+$/.test(text)) return "Letters a–z only.";
  return null;
}

function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps the driver error in a DrizzleQueryError — the Postgres error code
  // lives on `.cause.code`, not on the wrapper itself.
  const cause = typeof err === "object" && err !== null ? (err as { cause?: unknown }).cause : undefined;
  return typeof cause === "object" && cause !== null && (cause as { code?: string }).code === "23505";
}

export async function listDraftRadioTriggers() {
  await requireAdmin();
  return db.select().from(radioTriggers);
}

/** Returns an error message, or null on success. */
export async function createRadioTrigger(raw: string): Promise<string | null> {
  await requireAdmin();
  const text = normalizeTrigger(raw);
  const invalid = validateTrigger(text);
  if (invalid) return invalid;

  try {
    await db.insert(radioTriggers).values({ text });
  } catch (err) {
    if (isUniqueViolation(err)) return "That trigger already exists.";
    throw err;
  }
  revalidatePath("/", "layout");
  return null;
}

/** Returns an error message, or null on success. */
export async function updateRadioTrigger(id: number, raw: string): Promise<string | null> {
  await requireAdmin();
  const text = normalizeTrigger(raw);
  const invalid = validateTrigger(text);
  if (invalid) return invalid;

  try {
    await db.update(radioTriggers).set({ text }).where(eq(radioTriggers.id, id));
  } catch (err) {
    if (isUniqueViolation(err)) return "That trigger already exists.";
    throw err;
  }
  revalidatePath("/", "layout");
  return null;
}

export async function deleteRadioTrigger(id: number) {
  await requireAdmin();
  await db.delete(radioTriggers).where(eq(radioTriggers.id, id));
  revalidatePath("/", "layout");
}

// ---- Collections ----

export async function listDraftCollections() {
  await requireAdmin();
  return db.select().from(collections).orderBy(asc(collections.sortOrder));
}

/** Returns an error message, or null on success. */
export async function createCollection(input: {
  slug: string;
  title: string;
  description: string;
}): Promise<string | null> {
  await requireAdmin();
  const slug = slugify(input.slug);
  if (!slug) return "Enter a slug.";

  const existing = await db.select({ sortOrder: collections.sortOrder }).from(collections);
  const nextOrder = existing.length ? Math.max(...existing.map((c) => c.sortOrder)) + 1 : 0;
  try {
    await db.insert(collections).values({ ...input, slug, coverImage: "", sortOrder: nextOrder });
  } catch (err) {
    if (isUniqueViolation(err)) return "A collection with that slug already exists.";
    throw err;
  }
  draftChanged();
  return null;
}

export async function updateCollection(
  id: number,
  fields: Partial<{ title: string; description: string; coverImage: string }>,
) {
  await requireAdmin();
  await db.update(collections).set(fields).where(eq(collections.id, id));
  draftChanged();
}

export async function deleteCollection(id: number) {
  await requireAdmin();
  await db.delete(collections).where(eq(collections.id, id));
  draftChanged();
}

export async function reorderCollections(orderedIds: number[]) {
  await requireAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(collections).set({ sortOrder: index }).where(eq(collections.id, id)),
    ),
  );
  draftChanged();
}

// ---- Photos ----

export async function listDraftPhotos(collectionId: number) {
  await requireAdmin();
  return db
    .select()
    .from(photos)
    .where(eq(photos.collectionId, collectionId))
    .orderBy(asc(photos.sortOrder));
}

/** Registers a photo already uploaded to Blob from the browser (see lib/admin/client-upload.ts) — the upload itself bypasses this server so it isn't capped at Vercel's 4.5MB server-action body limit. */
export async function uploadPhoto(
  collectionId: number,
  blobUrl: string,
  fields: { alt: string; caption?: string; width?: number; height?: number },
) {
  await requireAdmin();
  const existing = await db
    .select({ sortOrder: photos.sortOrder })
    .from(photos)
    .where(eq(photos.collectionId, collectionId))
    .orderBy(asc(photos.sortOrder));
  const nextOrder = existing.length ? existing[existing.length - 1].sortOrder + 1 : 0;

  await db.insert(photos).values({
    collectionId,
    blobUrl,
    alt: fields.alt,
    caption: fields.caption || null,
    width: fields.width,
    height: fields.height,
    sortOrder: nextOrder,
  });
  draftChanged();
}

export async function updatePhoto(
  id: number,
  fields: Partial<{
    alt: string;
    caption: string | null;
    collectionId: number;
    duetWithPhotoId: number | null;
  }>,
) {
  await requireAdmin();
  await db.update(photos).set(fields).where(eq(photos.id, id));
  draftChanged();
}

export async function deletePhoto(id: number) {
  await requireAdmin();
  await db.delete(photos).where(eq(photos.id, id));
  draftChanged();
}

export async function reorderPhotos(orderedIds: number[]) {
  await requireAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(photos).set({ sortOrder: index }).where(eq(photos.id, id)),
    ),
  );
  draftChanged();
}

// ---- Quotes ----

export async function listDraftQuotes() {
  await requireAdmin();
  return db.select().from(quotes).orderBy(asc(quotes.sortOrder));
}

export async function createQuote(input: {
  text: string;
  attribution?: string;
  emphasis: 1 | 2 | 3;
}) {
  await requireAdmin();
  const existing = await db.select({ sortOrder: quotes.sortOrder }).from(quotes);
  const nextOrder = existing.length ? Math.max(...existing.map((q) => q.sortOrder)) + 1 : 0;
  await db.insert(quotes).values({ ...input, sortOrder: nextOrder });
  draftChanged();
}

export async function updateQuote(
  id: number,
  fields: Partial<{ text: string; attribution: string | null; emphasis: number }>,
) {
  await requireAdmin();
  await db.update(quotes).set(fields).where(eq(quotes.id, id));
  draftChanged();
}

export async function deleteQuote(id: number) {
  await requireAdmin();
  await db.delete(quotes).where(eq(quotes.id, id));
  draftChanged();
}

export async function reorderQuotes(orderedIds: number[]) {
  await requireAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(quotes).set({ sortOrder: index }).where(eq(quotes.id, id)),
    ),
  );
  draftChanged();
}

// ---- Blog posts ----

export async function listDraftPosts() {
  await requireAdmin();
  return db.select().from(posts);
}

export async function savePost(input: {
  slug: string;
  title: string;
  date: string;
  description: string;
  body: string;
}) {
  await requireAdmin();
  await db
    .insert(posts)
    .values(input)
    .onConflictDoUpdate({ target: posts.slug, set: input });
  draftChanged();
}

export async function deletePost(slug: string) {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.slug, slug));
  draftChanged();
}

const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)\)/g;

export interface ImageCheckResult {
  referencedPath: string;
  status: "ok" | "missing" | "suggested";
  suggestion?: string;
  score?: number;
}

/**
 * Parses a dropped .md file, checks every referenced image against uploaded blog assets
 * for that slug, and fuzzy-matches unresolved ones by filename (no LLM). Saves the post
 * as a draft regardless — unresolved images are returned as warnings, not a hard block.
 */
/** gray-matter (js-yaml) parses an unquoted `date: 2026-08-07` as a JS Date, not a string. */
function normalizeFrontmatterDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value) return value.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function importMarkdownPost(rawMarkdown: string, slug: string) {
  await requireAdmin();
  const { data, content } = matter(rawMarkdown);
  const uploaded = await listAssetFilenames(`blog/${slug}`);
  const uploadedNames = uploaded.map((u) => u.name);

  let body = content;
  const imageChecks: ImageCheckResult[] = [];
  for (const m of [...content.matchAll(MARKDOWN_IMAGE_RE)]) {
    const refPath = m[1];
    const filename = refPath.split("/").pop() ?? refPath;
    const exact = uploaded.find((u) => u.name === filename);
    if (exact) {
      // The referenced path is almost always a local /blog/<slug>/... path from before the
      // image lived on Blob — rewrite it to the real URL so the published post doesn't
      // link to a path that no longer exists once public/blog is removed.
      body = body.split(refPath).join(exact.url);
      imageChecks.push({ referencedPath: refPath, status: "ok" });
      continue;
    }
    const match = findClosestMatch(filename, uploadedNames);
    imageChecks.push(
      match
        ? { referencedPath: refPath, status: "suggested", suggestion: match.candidate, score: match.score }
        : { referencedPath: refPath, status: "missing" },
    );
  }

  const post = {
    slug,
    title: data.title ?? slug,
    date: normalizeFrontmatterDate(data.date),
    description: data.description ?? "",
    body,
  };
  await savePost(post);

  return { post, imageChecks };
}

// ---- Publish ----

export async function publishAll() {
  await requireAdmin();
  await publishSnapshot();
  draftChanged();

  // revalidatePath("/", "layout") purges the whole route tree, including a page for a
  // slug that was just deleted — revalidating only slugs still in the draft tables (the
  // old per-slug loop) left a deleted post's or collection's prerendered page live and
  // fully readable at its old URL until the next deploy.
  revalidatePath("/", "layout");
}
