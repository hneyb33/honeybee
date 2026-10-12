"use client";

import React, { useState } from "react";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { Calendar, Clock, MapPin, User, Phone, CheckCircle, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export function BookingModal({ isOpen, onClose, listing }: BookingModalProps) {
  const [durationHours, setDurationHours] = useState(2);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("14:00");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [meetingLocation, setMeetingLocation] = useState(listing.neighborhood);
  const [specialNote, setSpecialNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const totalPrice = listing.hourly_rate * durationHours;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmed(true);

    // Save booking into localStorage for demo / local state
    const existingBookings = JSON.parse(
      localStorage.getItem("honeybee_bookings") || "[]"
    );
    const newBooking = {
      id: `hb-${Date.now()}`,
      listing_id: listing.id,
      listing_title: listing.title,
      listing_image: listing.cover_image,
      client_name: clientName,
      client_phone: clientPhone,
      starts_at: `${bookingDate} ${bookingTime}`,
      duration_hours: durationHours,
      price_amount: totalPrice,
      status: "requested",
      location: meetingLocation,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(
      "honeybee_bookings",
      JSON.stringify([newBooking, ...existingBookings])
    );
  };

  const resetAndClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Book Appointment with {listing.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {listing.kind === "service"
              ? "Schedule your private home specialist service."
              : "Arrange discreet and verified companionship."}
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-foreground">
                Request Sent Successfully!
              </h4>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {listing.title} has received your booking request for{" "}
                <strong className="text-foreground">{durationHours} hours</strong> on{" "}
                <strong className="text-foreground">{bookingDate || "selected date"}</strong>.
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4 text-left text-xs space-y-1.5 dark:bg-neutral-900 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Total:</span>
                <span className="font-bold text-foreground">{formatUGX(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold text-foreground">{meetingLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-amber-600">Pending Host Confirmation</span>
              </div>
            </div>

            <Button
              onClick={resetAndClose}
              className="w-full bg-airbnb-coral text-white hover:bg-[#AD3039] rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-airbnb-coral" /> Date
                </label>
                <Input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-airbnb-coral" /> Start Time
                </label>
                <Input
                  type="time"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Duration: <span className="font-bold text-airbnb-coral">{durationHours} Hours</span>
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      durationHours === hrs
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {hrs} {hrs === 1 ? "Hour" : "Hours"}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Your Name
                </label>
                <Input
                  required
                  placeholder="e.g. David"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Mobile Phone
                </label>
                <Input
                  required
                  placeholder="+256 700 000 000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Location / Meeting Address
              </label>
              <Input
                required
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="e.g. Hotel in Kololo, or Private Residence in Ntinda"
                className="mt-1"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Notes or Special Requirements
              </label>
              <textarea
                rows={2}
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Any special menu choices, dietary notes, or preferences..."
                className="mt-1 w-full rounded-xl border border-input bg-transparent p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Price Breakdown Banner */}
            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Estimated Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatUGX(totalPrice)}
                </span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Shield className="h-3.5 w-3.5" /> Verified Pricing
                </span>
                <span>{formatUGX(listing.hourly_rate)} × {durationHours} hrs</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-airbnb-coral text-white font-bold hover:bg-[#AD3039] rounded-xl shadow-md"
            >
              Confirm Booking Request
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
