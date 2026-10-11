"use client";

import React, { useState } from "react";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { MessageCircle, Send, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";

interface StickyBookingBarProps {
  listing: Listing;
}

export function StickyBookingBar({ listing }: StickyBookingBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // WhatsApp Pre-filled URL
  const whatsappUrl = listing.whatsapp_number
    ? `https://wa.me/${listing.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello ${listing.title}, I saw your verified profile on Honeybee and would like to inquire about booking.`
      )}`
    : null;

  // Telegram Pre-filled URL
  const telegramUrl = listing.telegram
    ? `https://t.me/${listing.telegram.replace("@", "")}`
    : null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Left Price Info */}
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">
              <span className="text-base sm:text-lg font-bold text-foreground">
                {formatUGX(listing.hourly_rate)}
              </span>{" "}
              <span className="text-xs text-muted-foreground font-normal">/ hour</span>
            </p>
            <p className="truncate text-xs text-muted-foreground hidden sm:block">
              {listing.neighborhood}, {listing.city} ·{" "}
              {listing.kind === "service" ? "Specialist Service" : listing.category}
            </p>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Chat (WhatsApp / Telegram) */}
            {(whatsappUrl || telegramUrl) && (
              <div className="relative">
                {whatsappUrl && telegramUrl ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setChatOpen(!chatOpen)}
                      className="rounded-full border-border text-xs sm:text-sm font-semibold gap-1.5"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <span>Chat</span>
                    </Button>

                    {chatOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1 text-xs shadow-xl animate-in fade-in zoom-in-95">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setChatOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                          WhatsApp
                        </a>
                        <a
                          href={telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setChatOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-t border-border"
                        >
                          <Send className="h-4 w-4 text-sky-500" />
                          Telegram
                        </a>
                      </div>
                    )}
                  </>
                ) : whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <a
                    href={telegramUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800"
                  >
                    <Send className="h-4 w-4 text-sky-500" />
                    <span>Telegram</span>
                  </a>
                )}
              </div>
            )}

            {/* Book Now Button */}
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-airbnb-coral text-white font-bold hover:bg-[#E00B41] shadow-md px-5 sm:px-7 rounded-full text-xs sm:text-sm gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Appointment</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        listing={listing}
      />
    </>
  );
}
