import { listDraftRadioSamples, listDraftRadioTriggers } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { RadioManager } from "./radio-manager";
import { TriggerManager } from "./trigger-manager";

export default async function RadioAdminPage() {
  const [samples, triggers] = await Promise.all([listDraftRadioSamples(), listDraftRadioTriggers()]);

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Radio samples</h1>
        <p className="mb-6 text-muted">
          Clips played by the easter egg below. Playback order is randomized, so
          there&apos;s nothing to reorder here — just add or remove clips.
        </p>
        <RadioManager samples={samples} />
      </div>

      <div>
        <h2 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Keystroke triggers</h2>
        <p className="mb-6 text-muted">
          Typing one of these words fires the easter egg. Letters a–z only.
        </p>
        <TriggerManager triggers={triggers} />
      </div>
    </div>
  );
}
