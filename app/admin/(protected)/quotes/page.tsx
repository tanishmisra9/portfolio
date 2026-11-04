import { getDraftQuotesSubtitle, listDraftQuotes } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { QuotesManager } from "./quotes-manager";

export default async function QuotesAdminPage() {
  const [quotes, subtitle] = await Promise.all([listDraftQuotes(), getDraftQuotesSubtitle()]);

  return (
    <div className="max-w-5xl">
      <h1 className={ADMIN_SECTION_HEADING_CLASSES}>Quotes</h1>
      <p className="mb-6 mt-2 text-base text-dim">
        Size controls how large a quote appears on the Quotes page. Featured quotes can take the big hero spot.
      </p>
      <QuotesManager quotes={quotes} subtitle={subtitle} />
    </div>
  );
}
