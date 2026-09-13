import { PhotosIndexMotion } from "@/components/photos/photos-index-motion";
import { getPublishedData } from "@/lib/site-content";
import type { RandomPhotoCandidate } from "@/data/photos";

const PINNED_FIRST_SLUG = "super-max";

function getRandomPhotoCandidates(
  collections: Awaited<ReturnType<typeof getPublishedData>>["collections"],
): RandomPhotoCandidate[] {
  return collections
    .filter((collection) => collection.slug !== "super-max")
    .flatMap((collection) =>
      collection.photos.flatMap((photo) => {
        const primary: RandomPhotoCandidate = {
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          collectionTitle: collection.title,
          collectionSlug: collection.slug,
        };
        return photo.duetWith
          ? [
              primary,
              {
                src: photo.duetWith.src,
                alt: photo.duetWith.alt,
                collectionTitle: collection.title,
                collectionSlug: collection.slug,
              },
            ]
          : [primary];
      }),
    );
}

export default async function PhotosPage() {
  const data = await getPublishedData();
  const indexCollections = [...data.collections]
    .sort((a, b) => {
      if (a.slug === PINNED_FIRST_SLUG) return -1;
      if (b.slug === PINNED_FIRST_SLUG) return 1;
      return 0;
    })
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      coverImage: c.coverImage,
    }));

  return (
    <main id="main-content" tabIndex={-1} className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24">
      <PhotosIndexMotion
        collections={indexCollections}
        randomPhotos={getRandomPhotoCandidates(data.collections)}
      />
    </main>
  );
}
