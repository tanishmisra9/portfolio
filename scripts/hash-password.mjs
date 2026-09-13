import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run admin:hash-password -- \"your password\"");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Next.js expands $VAR references in .env files, so literal $ in a bcrypt hash
// must be escaped as \$ or it gets silently mangled before your code ever sees it.
const escaped = hash.replace(/\$/g, "\\$");
console.log("\nAdd this to your .env (as ADMIN_PASSWORD_HASH) — already escaped for Next.js:\n");
console.log(`ADMIN_PASSWORD_HASH=${escaped}`);
console.log();
