import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { PhotosHeader } from "@/components/photos/photos-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { collections } from "@/data/photos";

export default function PhotosPage() {
  return (
    <main className="relative z-0 isolate px-6 pb-24 pt-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <PhotosHeader />
        </ScrollReveal>
        <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
          <p className="text-[1.375rem] leading-snug text-neutral-400">
            #ShotOniPhone17Pro
          </p>
          <a
            href="https://www.instagram.com/tanishtakespics/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-[0.6875rem] text-neutral-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Instagram"
          >
            <Instagram
              className="h-[1.375rem] w-[1.375rem]"
              strokeWidth={1.75}
              aria-hidden
            />
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-16 md:gap-6">
          {collections.map((collection, index) => (
            <ScrollReveal key={collection.slug}>
              <Link
                href={`/photos/${collection.slug}`}
                className="group relative block min-h-[280px] overflow-hidden rounded-md border border-white/10 bg-black/40 backdrop-blur-md transition-colors duration-200 hover:border-neutral-400"
              >
                <Image
                  src={collection.coverImage}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  priority={index < 2}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6 pt-16">
                  <span className="font-display text-2xl font-semibold text-white md:text-3xl">
                    {collection.title}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {collection.photos.length}{" "}
                    {collection.photos.length === 1 ? "photo" : "photos"}
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </main>
  );
}
