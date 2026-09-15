import { listDraftQuotes } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { QuotesManager } from "./quotes-manager";

export default async function QuotesAdminPage() {
  const quotes = await listDraftQuotes();

  return (
    <div className="max-w-5xl">
      <h1 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Quotes</h1>
      <QuotesManager quotes={quotes} />
    </div>
  );
}
