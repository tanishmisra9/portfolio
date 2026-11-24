import { listDraftCollections } from "@/lib/admin/actions";
import { CollectionsManager } from "./collections-manager";

export default async function PhotosAdminPage() {
  const collections = await listDraftCollections();

  return (
    <div className="max-w-5xl">
      <CollectionsManager collections={collections} />
    </div>
  );
}
