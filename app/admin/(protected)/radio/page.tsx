import { listDraftRadioSamples } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { RadioManager } from "./radio-manager";

export default async function RadioAdminPage() {
  const samples = await listDraftRadioSamples();

  return (
    <div className="max-w-5xl">
      <h1 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Radio samples</h1>
      <p className="mb-6 text-muted">
        Clips played by the &quot;bbb&quot; / &quot;boxbox&quot; keystroke easter egg.
        Playback order is randomized, so there&apos;s nothing to reorder here — just add
        or remove clips.
      </p>
      <RadioManager samples={samples} />
    </div>
  );
}
