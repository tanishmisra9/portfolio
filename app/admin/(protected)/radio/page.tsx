import { listDraftRadioSamples, listDraftRadioTriggers } from "@/lib/admin/actions";
import { getPublishedData, NO_SNAPSHOT_MESSAGE } from "@/lib/site-content";
import { AdminHeading } from "@/components/admin/ui/panel";
import { RadioManager } from "./radio-manager";
import { TriggerManager } from "./trigger-manager";

export default async function RadioAdminPage() {
  // Nothing published yet (or a snapshot from before radio was part of it) → everything is new.
  // Only the no-snapshot case is swallowed; a real read error should surface, not mislabel everything "New".
  const [samples, triggers, live] = await Promise.all([
    listDraftRadioSamples(),
    listDraftRadioTriggers(),
    getPublishedData()
      .then((d) => d.radio)
      .catch((err: Error) => {
        if (err.message.startsWith(NO_SNAPSHOT_MESSAGE)) return undefined;
        throw err;
      }),
  ]);

  return (
    <div className="max-w-5xl space-y-12">
      <section>
        <AdminHeading
          title="Radio Samples"
          subtitle="Clips played by the easter egg below. Playback order is randomized, so there's nothing to reorder here: just add or remove clips. Changes go live on Publish; anything tagged New or outlined differs from the last publish."
        />
        <RadioManager samples={samples} liveUrls={live?.samples ?? []} />
      </section>

      <section>
        <h2 className="font-display text-2xl/[1.4] font-extrabold tracking-tight text-fg md:text-3xl/[1.4]">Keystroke Triggers</h2>
        <p className="mb-6 max-w-2xl text-base text-muted">Typing one of these words fires the easter egg. Letters a–z only.</p>
        <TriggerManager triggers={triggers} liveTexts={live?.triggers ?? []} />
      </section>
    </div>
  );
}
