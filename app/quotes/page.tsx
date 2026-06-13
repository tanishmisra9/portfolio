import { QuoteCloud } from "@/components/quotes/quote-cloud";
import { quotes } from "@/data/quotes";

export default function QuotesPage() {
  return <QuoteCloud quotes={quotes} />;
}
