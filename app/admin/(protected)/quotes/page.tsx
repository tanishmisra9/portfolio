import { listDraftQuotes } from "@/lib/admin/actions";
import { QuotesManager } from "./quotes-manager";

export default async function QuotesAdminPage() {
  const quotes = await listDraftQuotes();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 font-display text-xl">Quotes</h1>
      <QuotesManager quotes={quotes} />
    </div>
  );
}
