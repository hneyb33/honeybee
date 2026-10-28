"use client";

import React from "react";
import { ArrowUpRight, CheckCircle2, Clock, MapPin, MessageCircle, Send } from "lucide-react";
import { Listing, ProfileOffering } from "@/lib/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

interface BookingService {
  name: string;
  groupName?: string;
  turnaround?: string;
  locationType?: string;
}

function mapOffering(offering: ProfileOffering): BookingService {
  return {
    name: offering.name,
    groupName: offering.group_name,
    turnaround: offering.turnaround,
    locationType: offering.location_type,
  };
}

export function BookingModal({ isOpen, onClose, listing }: BookingModalProps) {
  const services: BookingService[] = listing.kind === "service" && listing.offerings?.length
    ? listing.offerings.map(mapOffering)
    : listing.services_offered.map((name) => ({ name }));
  const contactDigits = listing.whatsapp_number?.replace(/\D/g, "") ?? "";
  const countryDigits = listing.whatsapp_code?.replace(/\D/g, "") || "256";
  const phoneDigits = contactDigits
    ? contactDigits.startsWith("00")
      ? contactDigits.slice(2)
      : contactDigits.startsWith(countryDigits)
        ? contactDigits
        : `${countryDigits}${contactDigits.startsWith("0") ? contactDigits.slice(1) : contactDigits}`
    : "";
  const telegramUsername = listing.telegram?.replace(/^@/, "").trim();

  const requestMessage = (service: BookingService) => {
    const details = [
      service.turnaround ? `Turnaround: ${service.turnaround}` : null,
      service.locationType ? `Location: ${service.locationType}` : null,
    ].filter(Boolean);
    const message = listing.kind === "service"
      ? [
          `Hello ${listing.title}, I found your profile on Honeybee and would like to ask about your "${service.name}" service.`,
          ...details,
          "Please let me know your availability and pricing.",
        ].join("\n")
      : `Hello ${listing.title}, I found your profile on Honeybee and am interested in your "${service.name}" experience. Please let me know your availability and pricing.`;

    return message;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {listing.kind === "service" ? `Request a service from ${listing.title}` : `Hot offers from ${listing.title}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {listing.kind === "service"
              ? "Choose a registered service to send a personalized request by WhatsApp or Telegram. Discuss pricing directly in chat."
              : "Choose an experience to send a personalized request by WhatsApp or Telegram. Discuss details directly in chat."}
          </DialogDescription>
        </DialogHeader>

        {services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service, index) => {
              const message = requestMessage(service);
              const whatsappUrl = phoneDigits
                ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`
                : undefined;
              const telegramUrl = telegramUsername
                ? `https://t.me/${telegramUsername}?text=${encodeURIComponent(message)}`
                : undefined;
              return (
                <div key={`${service.name}-${index}`} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {service.groupName && (
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {service.groupName}
                        </p>
                      )}
                      <h3 className="mt-0.5 font-semibold text-foreground">{service.name}</h3>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          aria-label={`Request ${service.name} via WhatsApp`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {telegramUrl && (
                        <a
                          href={telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          aria-label={`Request ${service.name} via Telegram`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
                        >
                          <Send className="h-4 w-4" />
                          Telegram
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {!whatsappUrl && !telegramUrl && (
                        <span className="text-xs text-muted-foreground">Messaging unavailable</span>
                      )}
                    </div>
                  </div>
                  {(service.turnaround || service.locationType) && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {service.turnaround && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {service.turnaround}
                        </span>
                      )}
                      {service.locationType && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {service.locationType}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              {listing.kind === "service" ? "No services are registered yet" : "No hot offers selected"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This profile has not added services that can be requested here.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
