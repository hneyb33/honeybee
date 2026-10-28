"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Grid } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PhotoMosaicProps {
  images: string[];
  title: string;
}

export function PhotoMosaic({ images, title }: PhotoMosaicProps) {
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const displayImages = images.length > 0 ? images : ["/images/footer_bg.jpeg"];

  const handleOpenPhoto = (img: string) => {
    setSelectedPhoto(img);
    setModalOpen(true);
  };

  return (
    <div className="relative w-full">
      {/* Mobile Slider */}
      <div
        className="relative aspect-[4/4.5] w-full overflow-hidden rounded-2xl md:hidden"
        aria-label={`${title} photos`}
      >
        <div
          ref={mobileTrackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) setActiveMobileIndex(Math.round(track.scrollLeft / track.clientWidth));
          }}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
        >
          {displayImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleOpenPhoto(image)}
              aria-label={`View ${title} photo ${index + 1} full screen`}
              className="relative h-full w-full shrink-0 snap-center appearance-none border-0 bg-transparent p-0 text-left"
            >
              <Image
                src={image}
                alt={`${title} photo ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
            </button>
          ))}
        </div>
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => mobileTrackRef.current?.scrollBy({ left: -(mobileTrackRef.current.clientWidth), behavior: "smooth" })}
              aria-label="Previous profile photo"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => mobileTrackRef.current?.scrollBy({ left: mobileTrackRef.current.clientWidth, behavior: "smooth" })}
              aria-label="Next profile photo"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur">
            {displayImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  mobileTrackRef.current?.scrollTo({
                    left: index * (mobileTrackRef.current?.clientWidth ?? 0),
                    behavior: "smooth",
                  });
                  setActiveMobileIndex(index);
                }}
                aria-label={`Show photo ${index + 1}`}
                aria-current={activeMobileIndex === index}
                className={`h-1.5 rounded-full transition-all ${
                  activeMobileIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop five-photo gallery */}
      <div className="hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
        {/* Hero Photo (Left 2 columns, spans 2 rows) */}
        <div
          onClick={() => handleOpenPhoto(displayImages[0])}
          className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden bg-neutral-100 group"
        >
          <Image
            src={displayImages[0]}
            alt={`${title} main`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>

        {/* Remaining 4 Photos */}
        {displayImages.slice(1, 5).map((img, idx) => (
          <div
            key={idx}
            onClick={() => handleOpenPhoto(img)}
            className="relative cursor-pointer overflow-hidden bg-neutral-100 group"
          >
            <Image
              src={img}
              alt={`${title} gallery ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ))}

        {/* If fewer than 5 images, fill remaining slots gracefully */}
        {displayImages.length < 5 &&
          Array.from({ length: 5 - displayImages.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="relative bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-muted-foreground"
            >
              Honeybee
            </div>
          ))}

        {/* Show all photos button */}
        <button
          onClick={() => handleOpenPhoto(displayImages[0])}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-neutral-900 bg-white/95 px-4 py-2 text-xs font-semibold text-neutral-900 shadow-md hover:bg-white transition-all dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
        >
          <Grid className="h-3.5 w-3.5" />
          Show all photos
        </button>
      </div>

      {/* Full-screen Photo Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-hidden border-0 bg-black/95 p-0 sm:h-[80vh] sm:w-full sm:max-w-4xl"
          closeButtonClassName="right-3 top-3 z-10 text-white opacity-100 hover:bg-white/20 focus:ring-white dark:hover:bg-white/20"
        >
          <DialogTitle className="sr-only">{title} photo</DialogTitle>
          {selectedPhoto && (
            <div className="relative h-full w-full">
              <Image
                src={selectedPhoto}
                alt={title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
