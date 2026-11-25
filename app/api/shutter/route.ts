import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { shutterCount } from "@/db/schema";

// The global count of shots on the /photos camera title. Fails open: on any DB error it
// answers { count: null } and the page just hides the counter.

export const dynamic = "force-dynamic";

/** The column is a 32-bit integer: past this every increment would error and hide the counter for everyone. */
const MAX_COUNT = 2_000_000_000;
/** One counted shot per IP per this many ms (the title's flash itself lasts 800ms). */
const MIN_GAP_MS = 1000;

// ponytail: per-instance memory, so a determined script spread over many serverless instances still gets through; it
// stops a naive POST loop. A shared cap would be the login_attempts pattern (a table keyed by IP).
const lastShot = new Map<string, number>();

const reply = (count: number | null) =>
  Response.json({ count }, { headers: { "Cache-Control": "no-store" } });

async function read() {
  const [row] = await db.select({ count: shutterCount.count }).from(shutterCount);
  return row?.count ?? 0;
}

export async function GET() {
  try {
    return reply(await read());
  } catch (e) {
    console.error("shutter count read failed:", e);
    return reply(null);
  }
}

export async function POST() {
  try {
    // Vercel always sets x-forwarded-for; the first entry is the client.
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const now = Date.now();
    if (now - (lastShot.get(ip) ?? 0) < MIN_GAP_MS) return reply(await read()); // too soon: not counted
    lastShot.set(ip, now);
    if (lastShot.size > 10_000) lastShot.clear(); // bounded memory

    const [row] = await db
      .insert(shutterCount)
      .values({ id: 1, count: 1 })
      .onConflictDoUpdate({ target: shutterCount.id, set: { count: sql`least(${shutterCount.count} + 1, ${MAX_COUNT})` } })
      .returning({ count: shutterCount.count });
    return reply(row.count);
  } catch (e) {
    console.error("shutter count write failed:", e);
    return reply(null);
  }
}
