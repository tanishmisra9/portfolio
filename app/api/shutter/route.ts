import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { shutterCount } from "@/db/schema";

// The global count of shots on the /photos camera title. Fails open: on any DB error it
// answers { count: null } and the page just hides the counter.
// ponytail: anyone can POST in a loop; add a per-IP cap (login_attempts pattern) if it gets spammed.

export const dynamic = "force-dynamic";

const reply = (count: number | null) =>
  Response.json({ count }, { headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    const [row] = await db.select({ count: shutterCount.count }).from(shutterCount);
    return reply(row?.count ?? 0);
  } catch (e) {
    console.error("shutter count read failed:", e);
    return reply(null);
  }
}

export async function POST() {
  try {
    const [row] = await db
      .insert(shutterCount)
      .values({ id: 1, count: 1 })
      .onConflictDoUpdate({ target: shutterCount.id, set: { count: sql`${shutterCount.count} + 1` } })
      .returning({ count: shutterCount.count });
    return reply(row.count);
  } catch (e) {
    console.error("shutter count write failed:", e);
    return reply(null);
  }
}
