import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getCollectionBySlug, getAllCollectionSlugs } from "@/data/photos";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllCollectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) return { title: "Photos" };
  return {
    title: `${collection.title} — Tanish Misra`,
    description: collection.description,
  };
}

export default async function PhotoCollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <main className="relative z-0 isolate px-6 pb-24 pt-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/photos"
          className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:mb-12"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to photos
        </Link>

        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tighter text-white md:text-5xl">
          {collection.title}
        </h1>
        <p className="mt-4 text-lg text-neutral-400 md:text-xl">
          {collection.description}
        </p>

        <div className="mt-12 flex flex-col gap-10 md:mt-16 md:gap-10">
          {collection.photos.map((photo, index) => (
            <ScrollReveal key={`${photo.src}-${index}`}>
              <figure className="m-0">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={4032}
                  height={3024}
                  style={{ width: "100%", height: "auto" }}
                  sizes="(max-width: 768px) 100vw, 896px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="rounded-md border border-white/10"
                  priority={index === 0}
                />
                {photo.caption ? (
                  <figcaption className="mt-3 text-lg text-neutral-400 md:text-xl">
                    {photo.caption}
                  </figcaption>
                ) : null}
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </main>
  );
}
