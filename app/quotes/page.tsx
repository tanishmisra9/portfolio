import { QuoteCloud } from "@/components/quotes/quote-cloud";
import { getPublishedData } from "@/lib/site-content";

export default async function QuotesPage() {
  const data = await getPublishedData();
  return <QuoteCloud quotes={data.quotes} />;
}
