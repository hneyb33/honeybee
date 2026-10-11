"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Grid } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

  useEffect(() => {
    const track = mobileTrackRef.current;
    if (!track || displayImages.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = window.setInterval(() => {
      const nextIndex = (activeMobileIndex + 1) % displayImages.length;
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: "smooth" });
      setActiveMobileIndex(nextIndex);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeMobileIndex, displayImages.length]);

  const handleOpenPhoto = (img: string) => {
    setSelectedPhoto(img);
    setModalOpen(true);
  };

  return (
    <div className="relative w-full">
      {/* Mobile Slider */}
      <div
        ref={mobileTrackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          if (track.clientWidth > 0) setActiveMobileIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
        className="relative flex aspect-[4/4.5] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-2xl no-scrollbar md:hidden"
        aria-label={`${title} photos`}
      >
        {displayImages.map((image, index) => (
          <div key={`${image}-${index}`} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={image}
              alt={`${title} photo ${index + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0">
          {selectedPhoto && (
            <div className="relative h-[80vh] w-full">
              <Image
                src={selectedPhoto}
                alt={title}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
