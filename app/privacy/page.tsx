import type { Metadata } from "next";
import { getPublishedData } from "@/lib/site-content";

export const metadata: Metadata = { title: "Privacy Policy — Tanish Misra" };

export default async function PrivacyPage() {
  const { portfolio } = await getPublishedData();
  const email = portfolio.social.find((s) => s.href.startsWith("mailto:"))?.href.slice(7);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative z-0 isolate mx-auto max-w-2xl px-6 pb-12 pt-12 md:py-24"
    >
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-fg md:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: November 22, 2026</p>
      <div className="mt-10 space-y-8 text-base text-muted">
        <p>
          This is a personal portfolio site. It has no accounts, no sign-up, and no forms, and it
          doesn&apos;t sell or share personal data.
        </p>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Analytics</h2>
          <p>
            I use Vercel Web Analytics and Vercel Speed Insights to see aggregate page views and
            page performance. They don&apos;t use cookies and don&apos;t track you across other
            sites.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Cookies and local storage</h2>
          <p>
            Visitors get no cookies. Your light/dark theme choice is saved in your browser&apos;s
            local storage so it persists; it never leaves your device.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Hosting</h2>
          <p>
            The site is hosted on Vercel, with images on Vercel Blob. Like any web host, Vercel may
            process technical data such as your IP address to serve pages. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-fg"
            >
              Vercel&apos;s privacy policy
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg">Contact</h2>
          <p>
            If you email me, I use your message and address only to reply.
            {email ? (
              <>
                {" "}
                Questions about this policy:{" "}
                <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-fg">
                  {email}
                </a>
                .
              </>
            ) : null}
          </p>
        </section>
      </div>
    </main>
  );
}
