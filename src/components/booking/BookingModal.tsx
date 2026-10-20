"use client";

import React from "react";
import { ArrowUpRight, CheckCircle2, Clock, MapPin, MessageCircle } from "lucide-react";
import { Listing, ProfileOffering } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

interface BookingService {
  name: string;
  price?: number;
  pricingModel?: string;
  groupName?: string;
  turnaround?: string;
  locationType?: string;
}

function mapOffering(offering: ProfileOffering): BookingService {
  return {
    name: offering.name,
    price: offering.price,
    pricingModel: offering.pricing_model,
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

  const serviceRequestUrl = (service: BookingService) => {
    if (!phoneDigits) return undefined;

    const details = [
      listing.kind === "service" && service.price != null
        ? `Listed price: ${formatUGX(service.price)}${service.pricingModel ? ` (${service.pricingModel})` : ""}`
        : null,
      service.turnaround ? `Turnaround: ${service.turnaround}` : null,
      service.locationType ? `Location: ${service.locationType}` : null,
    ].filter(Boolean);
    const message = listing.kind === "service"
      ? [
          `Hello ${listing.title}, I saw your verified profile on Honeybee and would like to request your "${service.name}" service.`,
          ...details,
          "Please let me know your availability and how to proceed.",
        ].join("\n")
      : `Hello ${listing.title}, I saw your Hot offers on Honeybee and would like to discuss "${service.name}". Please let me know your availability and details.`;

    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
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
              ? "Choose one of this profile's registered services to start a personalized WhatsApp request."
              : "Choose an experience to discuss directly over WhatsApp. You and the model can agree on details in chat."}
          </DialogDescription>
        </DialogHeader>

        {services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service, index) => {
              const href = serviceRequestUrl(service);
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
                      {listing.kind === "service" && service.price != null && (
                        <p className="mt-1 text-sm font-bold text-airbnb-coral">
                          {formatUGX(service.price)}
                          {service.pricingModel && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              · {service.pricingModel}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {listing.kind === "service" ? "Request" : "Chat about this"}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">WhatsApp unavailable</span>
                    )}
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
