"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Grid } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PhotoMosaicProps {
  images: string[];
  title: string;
}

export function PhotoMosaic({ images, title }: PhotoMosaicProps) {
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
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
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:hidden">
        <Image
          src={displayImages[activeMobileIndex]}
          alt={`${title} photo ${activeMobileIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveMobileIndex(
                  (prev) => (prev - 1 + displayImages.length) % displayImages.length
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setActiveMobileIndex((prev) => (prev + 1) % displayImages.length)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
              {activeMobileIndex + 1} / {displayImages.length}
            </div>
          </>
        )}
      </div>

      {/* Desktop Airbnb 5-Photo Mosaic */}
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
