import { PhotosIndexMotion } from "@/components/photos/photos-index-motion";
import { getPublishedData } from "@/lib/site-content";

const PINNED_FIRST_SLUG = "super-max";

export default async function PhotosPage() {
  const data = await getPublishedData();
  const indexCollections = [...data.collections]
    .sort((a, b) => {
      if (a.slug === PINNED_FIRST_SLUG) return -1;
      if (b.slug === PINNED_FIRST_SLUG) return 1;
      return 0;
    })
    .map((c, i) => ({
      slug: c.slug,
      title: c.title,
      coverImage: c.coverImage,
      frames: c.photos.reduce((n, p) => n + (p.duetWith ? 2 : 1), 0),
      strip: c.photos
        .map((p) => p.src)
        .filter((src) => src !== c.coverImage)
        .slice(0, i === 0 ? 4 : 3),
    }));

  return (
    <main id="main-content" tabIndex={-1} className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24">
      <PhotosIndexMotion collections={indexCollections} />
    </main>
  );
}
