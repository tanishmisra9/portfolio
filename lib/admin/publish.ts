import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { portfolio, collections, photos, quotes, posts, publishedSnapshot } from "@/db/schema";
import type { PortfolioContent, PhotoCollection, QuoteEntry, BlogPostMeta } from "@/types/content";

export interface PublishedBlogPost extends BlogPostMeta {
  content: string;
}

export interface PublishedData {
  portfolio: PortfolioContent;
  collections: PhotoCollection[];
  quotes: QuoteEntry[];
  posts: PublishedBlogPost[];
}

/** Assembles the current draft state into the shape the public site reads. */
async function buildPublishedData(): Promise<PublishedData> {
  const [[portfolioRow], collectionRows, photoRows, quoteRows, postRows] = await Promise.all([
    db.select().from(portfolio),
    db.select().from(collections).orderBy(asc(collections.sortOrder)),
    db.select().from(photos).orderBy(asc(photos.sortOrder)),
    db.select().from(quotes).orderBy(asc(quotes.sortOrder)),
    db.select().from(posts),
  ]);

  const photosByCollection = new Map<number, typeof photoRows>();
  for (const photo of photoRows) {
    const list = photosByCollection.get(photo.collectionId) ?? [];
    list.push(photo);
    photosByCollection.set(photo.collectionId, list);
  }
  const photoById = new Map(photoRows.map((p) => [p.id, p]));
  const duetPartnerIds = new Set(
    photoRows.filter((p) => p.duetWithPhotoId !== null).map((p) => p.duetWithPhotoId),
  );

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
          projects: portfolioRow.projects.filter((p) => !p.hidden),
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
    collections: collectionRows
      // A collection with no cover and no photos has nothing to show on the /photos
      // index — an empty tile there with no way to fix it from the admin.
      .filter((c) => (photosByCollection.get(c.id) ?? []).length > 0)
      .map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
        // New collections start with coverImage: "" and have no way to set one in the
        // admin — fall back to the first photo rather than shipping a blank <Image src="">.
        coverImage: c.coverImage || photosByCollection.get(c.id)![0].blobUrl,
        photos: (photosByCollection.get(c.id) ?? [])
          // A photo referenced as another photo's duet partner renders nested inside that
          // photo's `duetWith`, not as its own top-level entry.
          .filter((p) => !duetPartnerIds.has(p.id))
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

  return data;
}

/** Stores the current draft state as the live snapshot. */
export async function publish() {
  const data = await buildPublishedData();
  await db
    .insert(publishedSnapshot)
    .values({ id: 1, data, publishedAt: new Date() })
    .onConflictDoUpdate({
      target: publishedSnapshot.id,
      set: { data, publishedAt: new Date() },
    });
}

// jsonb doesn't preserve key order, so compare with keys sorted; JSON.stringify also drops
// undefined values, matching what was actually stored.
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)))
      : v,
  );
}

/** True when the drafts differ from what's currently live (or nothing has been published yet). */
export async function hasUnpublishedChanges(): Promise<boolean> {
  const [draft, [snapshot]] = await Promise.all([
    buildPublishedData(),
    db.select().from(publishedSnapshot),
  ]);
  return !snapshot || canonical(draft) !== canonical(snapshot.data);
}
