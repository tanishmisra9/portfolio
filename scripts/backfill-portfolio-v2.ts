/**
 * One-time backfill: the live Neon `portfolio` draft row still has the pre-admin-overhaul
 * shape (free-text `date` strings, nested `pillRows`, no `id` on social/course/link
 * entries). data/portfolio.ts was hand-updated to the new shape (types/content.ts) as
 * part of this change, so it's already the verified target state — this script just
 * writes it into the draft row, rather than re-deriving a transform from the old shape.
 *
 * Does NOT call publish() — published_snapshot still holds the old-shape data and is
 * the live rollback. Verify in /admin/portfolio, then publish manually when ready.
 *
 * Usage:
 *   npm run db:backfill-portfolio-v2 -- --dry-run   (prints the object, writes nothing)
 *   npm run db:backfill-portfolio-v2                (writes the draft row)
 */
import "dotenv/config";
import { db } from "../db/client";
import { portfolio } from "../db/schema";
import { portfolio as portfolioData } from "../data/portfolio";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    console.log(JSON.stringify(portfolioData, null, 2));
    console.log("\n--dry-run: nothing written.");
    return;
  }

  await db
    .insert(portfolio)
    .values({ id: 1, ...portfolioData })
    .onConflictDoUpdate({ target: portfolio.id, set: portfolioData });

  console.log("Draft portfolio row updated. Verify in /admin/portfolio, then publish when ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
