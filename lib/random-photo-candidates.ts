import type { PhotoCollection, RandomPhotoCandidate } from "@/types/content";

/**
 * Flattens every collection except `super-max` into hover-preview candidates for the
 * photos index, from the DB-published collections (app/photos/page.tsx).
 */
export function getRandomPhotoCandidates(collections: PhotoCollection[]): RandomPhotoCandidate[] {
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
