import { PhotosIndexMotion } from "@/components/photos/photos-index-motion";
import { collections } from "@/data/photos";

export default function PhotosPage() {
  const indexCollections = collections.map((c) => ({
    slug: c.slug,
    title: c.title,
    coverImage: c.coverImage,
    photoCount: c.photos.length,
  }));

  return (
    <main className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24">
      <PhotosIndexMotion collections={indexCollections} />
    </main>
  );
}
