/**
 * One-off migration: copies data/*.ts + content/blog/*.md + their images into the
 * database and Vercel Blob, then runs publish() once so the live site matches
 * production immediately after cutover. Safe to re-run — it clears the draft tables
 * first, so re-running just re-imports from the same source files.
 *
 * Usage: npm run db:migrate-content
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { put } from "@vercel/blob";
import { imageSize } from "image-size";
import { db } from "../db/client";
import { portfolio, collections, photos, quotes, posts } from "../db/schema";
import { publish } from "../lib/admin/publish";
import { portfolio as portfolioData } from "../data/portfolio";
import { collections as collectionsData } from "../data/photos";
import { quotes as quotesData } from "../data/quotes";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function uploadPublicFile(publicSrc: string, blobPathnamePrefix: string) {
  const relativePath = publicSrc.replace(/^\/+/, "");
  const filePath = path.join(PUBLIC_DIR, relativePath);
  const buffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const blob = await put(`${blobPathnamePrefix}/${filename}`, buffer, {
    access: "public",
    addRandomSuffix: true,
  });

  let dims: { width: number; height: number } | null = null;
  try {
    dims = imageSize(buffer);
  } catch {
    // dimensions stay null — non-fatal, layout falls back to auto sizing
  }
  return { url: blob.url, ...dims };
}

async function migratePortfolio() {
  console.log("Migrating portfolio...");
  await db
    .insert(portfolio)
    .values({ id: 1, ...portfolioData })
    .onConflictDoUpdate({ target: portfolio.id, set: portfolioData });
}

async function migratePhotos() {
  console.log("Migrating photo collections...");
  await db.delete(photos);
  await db.delete(collections);

  for (const [index, collection] of collectionsData.entries()) {
    const coverUpload = await uploadPublicFile(collection.coverImage, `photos/${collection.slug}`);
    const [row] = await db
      .insert(collections)
      .values({
        slug: collection.slug,
        title: collection.title,
        description: collection.description,
        coverImage: coverUpload.url,
        sortOrder: index,
      })
      .returning();

    let sortOrder = 0;
    for (const photo of collection.photos) {
      const primaryUpload = await uploadPublicFile(photo.src, `photos/${collection.slug}`);

      let duetId: number | null = null;
      if (photo.duetWith) {
        const duetUpload = await uploadPublicFile(photo.duetWith.src, `photos/${collection.slug}`);
        const [duetRow] = await db
          .insert(photos)
          .values({
            collectionId: row.id,
            blobUrl: duetUpload.url,
            alt: photo.duetWith.alt,
            width: photo.duetWith.width ?? duetUpload.width,
            height: photo.duetWith.height ?? duetUpload.height,
            sortOrder: sortOrder++,
          })
          .returning();
        duetId = duetRow.id;
      }

      await db.insert(photos).values({
        collectionId: row.id,
        blobUrl: primaryUpload.url,
        alt: photo.alt,
        caption: photo.caption ?? null,
        width: photo.width ?? primaryUpload.width,
        height: photo.height ?? primaryUpload.height,
        sortOrder: sortOrder++,
        duetWithPhotoId: duetId,
      });
    }
    console.log(`  ${collection.slug}: ${collection.photos.length} photos`);
  }
}

async function migrateQuotes() {
  console.log("Migrating quotes...");
  await db.delete(quotes);
  for (const [index, quote] of quotesData.entries()) {
    await db.insert(quotes).values({
      text: quote.text,
      attribution: quote.attribution ?? null,
      emphasis: quote.emphasis ?? 1,
      sortOrder: index,
    });
  }
}

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

async function migrateBlogPosts() {
  console.log("Migrating blog posts...");
  if (!fs.existsSync(BLOG_DIR)) return;

  const slugs = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  for (const slug of slugs) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8");
    const { data, content } = matter(raw);

    const references = [...content.matchAll(MARKDOWN_IMAGE_RE)];
    let body = content;
    for (const [fullMatch, alt, refPath] of references) {
      if (!refPath.startsWith("/blog/")) continue;
      const upload = await uploadPublicFile(refPath, `blog/${slug}`);
      body = body.replace(fullMatch, `![${alt}](${upload.url})`);
    }

    await db
      .insert(posts)
      .values({
        slug,
        title: data.title,
        date: data.date,
        description: data.description,
        body,
      })
      .onConflictDoUpdate({
        target: posts.slug,
        set: { title: data.title, date: data.date, description: data.description, body },
      });
    console.log(`  ${slug}`);
  }
}

async function main() {
  await migratePortfolio();
  await migratePhotos();
  await migrateQuotes();
  await migrateBlogPosts();

  console.log("Publishing snapshot...");
  await publish();

  console.log("Done. Verify the site, then delete data/*.ts and the migrated public/photos, public/blog files.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
