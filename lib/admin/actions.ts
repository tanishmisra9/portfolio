"use server";

import { eq, asc } from "drizzle-orm";
import { imageSize } from "image-size";
import matter from "gray-matter";
import { db } from "@/db/client";
import { portfolio, collections, photos, quotes, posts, radioTriggers } from "@/db/schema";
import {
  uploadAsset,
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

// ---- Portfolio ----

export async function updatePortfolio(data: PortfolioContent) {
  await db
    .insert(portfolio)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: portfolio.id, set: data });
}

export async function getDraftPortfolio(): Promise<PortfolioContent | null> {
  const [row] = await db.select().from(portfolio);
  return row ?? null;
}

/** Returns the downloadUrl (serves with Content-Disposition: attachment) so the resume downloads with a clean filename cross-origin. */
export async function uploadResume(file: File, filename: string): Promise<string> {
  const blob = await uploadResumeBlob(file, filename);
  return blob.downloadUrl;
}

// ---- Radio easter-egg samples ----
// No draft/publish gating here — there's nothing to preview differently for a sound
// effect, so uploads/deletes take effect immediately via revalidating the root layout
// (getRadioSampleUrls is read there, shared by every route).

export async function listDraftRadioSamples() {
  return listRadioSamples();
}

/** Returns the uploaded blob's URL, or null if the file failed the audio check. */
export async function uploadRadioSample(file: File): Promise<string | null> {
  if (!isAllowedAudioFile(file.name, file.type)) return null;
  const blob = await uploadNamedAsset("radio", file, file.name);
  revalidatePath("/", "layout");
  return blob.url;
}

export async function deleteRadioSample(url: string) {
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
  return db.select().from(radioTriggers);
}

/** Returns an error message, or null on success. */
export async function createRadioTrigger(raw: string): Promise<string | null> {
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
  await db.delete(radioTriggers).where(eq(radioTriggers.id, id));
  revalidatePath("/", "layout");
}

// ---- Collections ----

export async function listDraftCollections() {
  return db.select().from(collections).orderBy(asc(collections.sortOrder));
}

export async function createCollection(input: {
  slug: string;
  title: string;
  description: string;
}) {
  const existing = await db.select({ sortOrder: collections.sortOrder }).from(collections);
  const nextOrder = existing.length ? Math.max(...existing.map((c) => c.sortOrder)) + 1 : 0;
  await db.insert(collections).values({ ...input, coverImage: "", sortOrder: nextOrder });
}

export async function updateCollection(
  id: number,
  fields: Partial<{ title: string; description: string; coverImage: string }>,
) {
  await db.update(collections).set(fields).where(eq(collections.id, id));
}

export async function deleteCollection(id: number) {
  await db.delete(collections).where(eq(collections.id, id));
}

export async function reorderCollections(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(collections).set({ sortOrder: index }).where(eq(collections.id, id)),
    ),
  );
}

// ---- Photos ----

export async function listDraftPhotos(collectionId: number) {
  return db
    .select()
    .from(photos)
    .where(eq(photos.collectionId, collectionId))
    .orderBy(asc(photos.sortOrder));
}

export async function uploadPhoto(
  collectionId: number,
  collectionSlug: string,
  file: File,
  fields: { alt: string; caption?: string },
) {
  const blob = await uploadAsset(`photos/${collectionSlug}`, file);
  let width: number | undefined;
  let height: number | undefined;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const size = imageSize(buffer);
    width = size.width;
    height = size.height;
  } catch {
    // dimensions are optional — layout falls back to auto sizing
  }

  const existing = await db
    .select({ sortOrder: photos.sortOrder })
    .from(photos)
    .where(eq(photos.collectionId, collectionId))
    .orderBy(asc(photos.sortOrder));
  const nextOrder = existing.length ? existing[existing.length - 1].sortOrder + 1 : 0;

  await db.insert(photos).values({
    collectionId,
    blobUrl: blob.url,
    alt: fields.alt,
    caption: fields.caption || null,
    width,
    height,
    sortOrder: nextOrder,
  });
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
  await db.update(photos).set(fields).where(eq(photos.id, id));
}

export async function deletePhoto(id: number) {
  await db.delete(photos).where(eq(photos.id, id));
}

export async function reorderPhotos(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(photos).set({ sortOrder: index }).where(eq(photos.id, id)),
    ),
  );
}

// ---- Quotes ----

export async function listDraftQuotes() {
  return db.select().from(quotes).orderBy(asc(quotes.sortOrder));
}

export async function createQuote(input: {
  text: string;
  attribution?: string;
  emphasis: 1 | 2 | 3;
}) {
  const existing = await db.select({ sortOrder: quotes.sortOrder }).from(quotes);
  const nextOrder = existing.length ? Math.max(...existing.map((q) => q.sortOrder)) + 1 : 0;
  await db.insert(quotes).values({ ...input, sortOrder: nextOrder });
}

export async function updateQuote(
  id: number,
  fields: Partial<{ text: string; attribution: string | null; emphasis: number }>,
) {
  await db.update(quotes).set(fields).where(eq(quotes.id, id));
}

export async function deleteQuote(id: number) {
  await db.delete(quotes).where(eq(quotes.id, id));
}

export async function reorderQuotes(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(quotes).set({ sortOrder: index }).where(eq(quotes.id, id)),
    ),
  );
}

// ---- Blog posts ----

export async function listDraftPosts() {
  return db.select().from(posts);
}

export async function savePost(input: {
  slug: string;
  title: string;
  date: string;
  description: string;
  body: string;
}) {
  await db
    .insert(posts)
    .values(input)
    .onConflictDoUpdate({ target: posts.slug, set: input });
}

export async function deletePost(slug: string) {
  await db.delete(posts).where(eq(posts.slug, slug));
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
export async function importMarkdownPost(rawMarkdown: string, slug: string) {
  const { data, content } = matter(rawMarkdown);
  const uploaded = await listAssetFilenames(`blog/${slug}`);

  const referenced = [...content.matchAll(MARKDOWN_IMAGE_RE)].map((m) => m[1]);
  const imageChecks: ImageCheckResult[] = referenced.map((refPath) => {
    const filename = refPath.split("/").pop() ?? refPath;
    if (uploaded.includes(filename)) {
      return { referencedPath: refPath, status: "ok" };
    }
    const match = findClosestMatch(filename, uploaded);
    return match
      ? { referencedPath: refPath, status: "suggested", suggestion: match.candidate, score: match.score }
      : { referencedPath: refPath, status: "missing" };
  });

  const post = {
    slug,
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString().slice(0, 10),
    description: data.description ?? "",
    body: content,
  };
  await savePost(post);

  return { post, imageChecks };
}

export async function uploadBlogImage(slug: string, file: File) {
  const blob = await uploadAsset(`blog/${slug}`, file);
  return blob.url;
}

// ---- Publish ----

const PUBLIC_PATHS = ["/", "/photos", "/blog", "/quotes"];

export async function publishAll() {
  await publishSnapshot();

  const collectionSlugs = await db.select({ slug: collections.slug }).from(collections);
  const postSlugs = await db.select({ slug: posts.slug }).from(posts);

  for (const path of PUBLIC_PATHS) revalidatePath(path);
  for (const { slug } of collectionSlugs) revalidatePath(`/photos/${slug}`);
  for (const { slug } of postSlugs) revalidatePath(`/blog/${slug}`);
}
