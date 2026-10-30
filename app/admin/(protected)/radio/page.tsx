import { listDraftRadioSamples, listDraftRadioTriggers } from "@/lib/admin/actions";
import { getPublishedData, NO_SNAPSHOT_MESSAGE } from "@/lib/site-content";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
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
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Radio samples</h1>
        <p className="mb-6 text-muted">
          Clips played by the easter egg below. Playback order is randomized, so
          there&apos;s nothing to reorder here — just add or remove clips. Changes go live on
          Publish; anything outlined is new since the last publish.
        </p>
        <RadioManager samples={samples} liveUrls={live?.samples ?? []} />
      </div>

      <div>
        <h2 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Keystroke triggers</h2>
        <p className="mb-6 text-muted">
          Typing one of these words fires the easter egg. Letters a–z only.
        </p>
        <TriggerManager triggers={triggers} liveTexts={live?.triggers ?? []} />
      </div>
    </div>
  );
}
