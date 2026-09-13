import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { portfolio, collections, photos, quotes, posts, publishedSnapshot } from "@/db/schema";
import type { PortfolioContent } from "@/types/content";
import type { PhotoCollection } from "@/data/photos";
import type { QuoteEntry } from "@/data/quotes";
import type { BlogPostMeta } from "@/lib/blog";

export interface PublishedBlogPost extends BlogPostMeta {
  content: string;
}

export interface PublishedData {
  portfolio: PortfolioContent;
  collections: PhotoCollection[];
  quotes: QuoteEntry[];
  posts: PublishedBlogPost[];
}

/** Assembles the current draft state into the shape the public site reads, and stores it as the live snapshot. */
export async function publish() {
  const [portfolioRow] = await db.select().from(portfolio);
  const collectionRows = await db.select().from(collections).orderBy(asc(collections.sortOrder));
  const photoRows = await db.select().from(photos).orderBy(asc(photos.sortOrder));
  const quoteRows = await db.select().from(quotes).orderBy(asc(quotes.sortOrder));
  const postRows = await db.select().from(posts);

  const photosByCollection = new Map<number, typeof photoRows>();
  for (const photo of photoRows) {
    const list = photosByCollection.get(photo.collectionId) ?? [];
    list.push(photo);
    photosByCollection.set(photo.collectionId, list);
  }
  const photoById = new Map(photoRows.map((p) => [p.id, p]));

  const data: PublishedData = {
    portfolio: portfolioRow
      ? {
          name: portfolioRow.name,
          heroSubtitle: portfolioRow.heroSubtitle,
          aboutBio: portfolioRow.aboutBio,
          experience: portfolioRow.experience,
          education: portfolioRow.education,
          skills: portfolioRow.skills,
          certifications: portfolioRow.certifications,
          projects: portfolioRow.projects,
          social: portfolioRow.social,
        }
      : {
          name: "",
          heroSubtitle: "",
          aboutBio: "",
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          projects: [],
          social: [],
        },
    collections: collectionRows.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      photos: (photosByCollection.get(c.id) ?? [])
        // A photo referenced as another photo's duet partner renders nested inside that
        // photo's `duetWith`, not as its own top-level entry.
        .filter((p) => !photoRows.some((other) => other.duetWithPhotoId === p.id))
        .map((p) => {
          const duet = p.duetWithPhotoId ? photoById.get(p.duetWithPhotoId) : undefined;
          return {
            src: p.blobUrl,
            alt: p.alt,
            caption: p.caption ?? undefined,
            width: p.width ?? undefined,
            height: p.height ?? undefined,
            duetWith: duet
              ? {
                  src: duet.blobUrl,
                  alt: duet.alt,
                  width: duet.width ?? undefined,
                  height: duet.height ?? undefined,
                }
              : undefined,
          };
        }),
    })),
    quotes: quoteRows.map((q) => ({
      id: String(q.id),
      text: q.text,
      attribution: q.attribution ?? undefined,
      emphasis: (q.emphasis as 1 | 2 | 3) ?? 1,
    })),
    posts: postRows.map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      description: p.description,
      content: p.body,
    })),
  };

  await db
    .insert(publishedSnapshot)
    .values({ id: 1, data, publishedAt: new Date() })
    .onConflictDoUpdate({
      target: publishedSnapshot.id,
      set: { data, publishedAt: new Date() },
    });
}
