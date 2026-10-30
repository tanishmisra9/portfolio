import { cache } from "react";
import { db } from "@/db/client";
import { publishedSnapshot } from "@/db/schema";
import type { PublishedData } from "@/lib/admin/publish";

export const NO_SNAPSHOT_MESSAGE = "No published content yet";

/** The public site's single read path — everything comes from the last-published snapshot, never the draft tables. */
export const getPublishedData = cache(async (): Promise<PublishedData> => {
  const [row] = await db.select().from(publishedSnapshot);
  if (!row) {
    throw new Error(
      `${NO_SNAPSHOT_MESSAGE} — publish once from /admin.`,
    );
  }
  return row.data as PublishedData;
});
