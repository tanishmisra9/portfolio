import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { collections } from "@/db/schema";
import { listDraftPhotos } from "@/lib/admin/actions";
import { PhotoManager } from "./photo-manager";

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
    <div className="max-w-3xl">
      <h1 className="mb-1 font-display text-xl">{collection.title}</h1>
      <p className="mb-4 text-sm text-dim">/{collection.slug}</p>
      <PhotoManager collectionId={collection.id} collectionSlug={collection.slug} photos={photos} />
    </div>
  );
}
