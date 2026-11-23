import type { Metadata } from "next";
import { getPublishedData } from "@/lib/site-content";

export const metadata: Metadata = { title: "Legal Notice — Tanish Misra" };

export default async function LegalPage() {
  const { portfolio } = await getPublishedData();
  const email = portfolio.social.find((s) => s.href.startsWith("mailto:"))?.href.slice(7);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate mx-auto max-w-2xl px-6 pb-12 pt-12 md:py-24"
    >
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-fg md:text-5xl">
        Legal Notice
      </h1>
      <div className="mt-10 space-y-8 text-base text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Site owner</h2>
          <p>
            Tanish Misra
            {email ? (
              <>
                <br />
                <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-fg">
                  {email}
                </a>
              </>
            ) : null}
          </p>
          <p className="mt-2">This is a personal, non-commercial website.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Copyright</h2>
          <p>
            Unless noted otherwise, the text, photos, and code on this site are © Tanish Misra. Please
            ask before reusing them.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">External links</h2>
          <p>
            This site links to third-party sites I don&apos;t control and am not responsible for their
            content.
          </p>
        </section>
      </div>
    </main>
  );
}
