import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { collections } from "@/db/schema";
import { listDraftPhotos } from "@/lib/admin/actions";
import { AdminHeading } from "@/components/admin/ui/panel";
import { AdminBackLink } from "@/components/admin/ui/back-link";
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
      <AdminBackLink href="/admin/photos" label="Back to collections" />
      <AdminHeading title={collection.title} subtitle={`/photos/${collection.slug}`} />
      <CollectionDetails id={collection.id} slug={collection.slug} title={collection.title} description={collection.description} />
      <PhotoManager collectionId={collection.id} collectionSlug={collection.slug} coverImage={collection.coverImage} photos={photos} />
    </div>
  );
}
