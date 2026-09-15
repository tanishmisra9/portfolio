import { listDraftCollections } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { CollectionsManager } from "./collections-manager";

export default async function PhotosAdminPage() {
  const collections = await listDraftCollections();

  return (
    <div className="max-w-5xl">
      <h1 className={`${ADMIN_SECTION_HEADING_CLASSES} mb-6`}>Photo collections</h1>
      <CollectionsManager collections={collections} />
    </div>
  );
}
