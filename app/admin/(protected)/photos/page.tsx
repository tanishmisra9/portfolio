import { listDraftCollections } from "@/lib/admin/actions";
import { CollectionsManager } from "./collections-manager";

export default async function PhotosAdminPage() {
  const collections = await listDraftCollections();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 font-display text-xl">Photo collections</h1>
      <CollectionsManager collections={collections} />
    </div>
  );
}
