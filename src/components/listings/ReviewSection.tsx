"use client";

import React, { useState } from "react";
import { Star, MessageSquarePlus } from "lucide-react";
import { Review } from "@/lib/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReviewSectionProps {
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  listingTitle: string;
}

export function ReviewSection({
  rating,
  reviewCount,
  reviews = [],
  listingTitle,
}: ReviewSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [clientName, setClientName] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Sample seed reviews if empty
  const displayReviews =
    reviews.length > 0
      ? reviews
      : [
          {
            id: "rev-1",
            client_id: "c-1",
            client_name: "Edward K.",
            listing_id: "l-1",
            rating: 5,
            body: "Extremely professional, punctual, and discrete. The experience surpassed expectations. Highly recommended!",
            created_at: "2026-09-18T10:00:00Z",
          },
          {
            id: "rev-2",
            client_id: "c-2",
            client_name: "Sarah M.",
            listing_id: "l-1",
            rating: 5,
            body: "Great communication right from the start. Very attentive, charming, and courteous. Will book again.",
            created_at: "2026-09-24T14:30:00Z",
          },
        ];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setReviewBody("");
      setClientName("");
    }, 1500);
  };

  return (
    <section className="border-b border-border py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {reviewCount > 0 ? rating.toFixed(1) : "New"} · {reviewCount}{" "}
            {reviewCount === 1 ? "review" : "reviews"}
          </h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="rounded-full text-xs font-semibold gap-1.5"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Write a review
        </Button>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {displayReviews.map((rev) => (
          <article
            key={rev.id}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-foreground">
                {rev.client_name || "Verified Client"}
              </span>
              <div className="flex items-center text-amber-400 text-xs">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                ))}
              </div>
            </div>
            {rev.body && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{rev.body}&rdquo;
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Review {listingTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Share your honest feedback. Your review will be published to help maintain platform trust.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center text-emerald-600 font-semibold text-sm">
              Thank you! Your review has been submitted.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Your Rating
                </label>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= userRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Your Name / Pseudonym
                </label>
                <Input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Ronald K."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Feedback &amp; Experience
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Describe your meeting or service experience..."
                  className="mt-1 w-full rounded-xl border border-input bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-airbnb-coral text-white hover:bg-[#AD3039]"
              >
                Submit Review
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
