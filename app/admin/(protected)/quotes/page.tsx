import { getDraftQuotesSubtitle, listDraftQuotes } from "@/lib/admin/actions";
import { AdminHeading } from "@/components/admin/ui/panel";
import { QuotesManager } from "./quotes-manager";

export default async function QuotesAdminPage() {
  const [quotes, subtitle] = await Promise.all([listDraftQuotes(), getDraftQuotesSubtitle()]);

  return (
    <div className="max-w-5xl">
      <AdminHeading
        title="Quotes"
        subtitle="Size controls how large a quote appears on the Quotes page. Featured quotes can take the big hero spot."
      />
      <QuotesManager quotes={quotes} subtitle={subtitle} />
    </div>
  );
}
