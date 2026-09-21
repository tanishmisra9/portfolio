import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { collections } from "@/db/schema";
import { listDraftPhotos } from "@/lib/admin/actions";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { PhotoManager } from "./photo-manager";
import { CollectionDetails } from "./collection-details";

export default async function CollectionPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collectionId = Number(id);
  const [collection] = await db.select().from(collections).where(eq(collections.id, collectionId));
  if (!collection) notFound();

  const photos = await listDraftPhotos(collectionId);

  return (
    <div className="max-w-5xl">
      <h1 className={ADMIN_SECTION_HEADING_CLASSES}>{collection.title}</h1>
      <p className="mb-6 mt-1 font-mono text-base text-dim">/{collection.slug}</p>
      <CollectionDetails id={collection.id} title={collection.title} description={collection.description} />
      <PhotoManager collectionId={collection.id} collectionSlug={collection.slug} photos={photos} />
    </div>
  );
}
