import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoAlbumMotion } from "@/components/photos/photo-album-motion";
import { getPublishedData } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const data = await getPublishedData();
  return data.collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedData();
  const collection = data.collections.find((c) => c.slug === slug);
  if (!collection) return { title: "Not Found — Tanish Misra" };
  return {
    title: `${collection.title} — Tanish Misra`,
    description: collection.description,
  };
}

export default async function PhotoCollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublishedData();
  const collection = data.collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  return (
    <main id="main-content" tabIndex={-1} className="relative z-0 isolate px-6 pb-24 pt-8 md:py-16">
      <PhotoAlbumMotion
        title={collection.title}
        slug={slug}
        description={collection.description}
        photos={collection.photos}
      />
    </main>
  );
}
