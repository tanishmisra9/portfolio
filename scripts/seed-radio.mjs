// One-time: copies the radio clips already in Blob (radio/…) into the new radio_samples
// draft table. Run after `npm run db:push`, then press Publish in /admin so the snapshot carries
// them (triggers already live in radio_triggers). Run it ONCE: it re-adds every audio blob
// under radio/, including clips you later deleted from the admin (their blobs are kept).
//   node --env-file=.env scripts/seed-radio.mjs
import { list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const { blobs } = await list({ prefix: "radio/" });
const audio = blobs.filter((b) => /\.(mp3|m4a|wav|ogg|webm)$/i.test(b.pathname));
for (const b of audio) {
  await sql`INSERT INTO radio_samples (url, pathname) VALUES (${b.url}, ${b.pathname}) ON CONFLICT (url) DO NOTHING`;
}
console.log(`Seeded ${audio.length} radio clip(s).`);
