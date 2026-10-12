"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { Check, Clock, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

type RequestableService = {
  id: string;
  name: string;
  groupName?: string;
  price?: number;
  pricingModel?: string;
  turnaround?: string;
  locationType?: string;
};

function normalizedWhatsAppNumber(listing: Listing) {
  const contactDigits = listing.whatsapp_number?.replace(/\D/g, "");
  const countryDigits = listing.whatsapp_code?.replace(/\D/g, "") ?? "";
  if (!contactDigits) return null;
  return contactDigits.startsWith("0") && countryDigits
    ? `${countryDigits}${contactDigits.slice(1)}`
    : contactDigits;
}

function requestMessage(listing: Listing, service: RequestableService) {
  const price = service.price === undefined
    ? ""
    : ` The listed price is ${formatUGX(service.price)}${service.pricingModel ? ` (${service.pricingModel})` : ""}.`;
  return `Hello ${listing.title}, I found your profile on Honeybee and would like to request ${service.name}.${price} Please let me know your availability and the next steps.`;
}

export function BookingModal({ isOpen, onClose, listing }: BookingModalProps) {
  const offerings = listing.offerings ?? [];
  const services: RequestableService[] = offerings.length > 0
    ? offerings.map((offering) => ({
        id: offering.id,
        name: offering.name,
        groupName: offering.group_name,
        price: offering.price,
        pricingModel: offering.pricing_model,
        turnaround: offering.turnaround,
        locationType: offering.location_type,
      }))
    : listing.services_offered.map((name, index) => ({
        id: `${listing.id}-service-${index}`,
        name,
        price: listing.hourly_rate,
        pricingModel: "per hour",
      }));

  const whatsappNumber = normalizedWhatsAppNumber(listing);
  const telegramUsername = listing.telegram?.trim().replace(/^@+/, "") ?? "";

  const whatsappLink = (service: RequestableService) =>
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(requestMessage(listing, service))}`
      : null;

  const telegramLink = (service: RequestableService) =>
    telegramUsername
      ? `https://t.me/${encodeURIComponent(telegramUsername)}?text=${encodeURIComponent(requestMessage(listing, service))}`
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader className="pr-8">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
            What would you like from {listing.title}?
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-muted-foreground">
            Choose a service to start a personalized request in WhatsApp or Telegram.
          </DialogDescription>
        </DialogHeader>

        {services.length > 0 ? (
          <div className="mt-2 space-y-3">
            {services.map((service) => {
              const waLink = whatsappLink(service);
              const tgLink = telegramLink(service);
              return (
                <article key={service.id} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      {service.groupName && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{service.groupName}</p>
                      )}
                      <h3 className="mt-0.5 font-semibold text-foreground">{service.name}</h3>
                      {service.price !== undefined && (
                        <p className="mt-1 text-sm font-bold text-airbnb-coral">
                          {formatUGX(service.price)}
                          {service.pricingModel && <span className="ml-1.5 text-xs font-medium text-muted-foreground">· {service.pricingModel}</span>}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {service.locationType && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{service.locationType}</span>}
                        {service.turnaround && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{service.turnaround}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {waLink && (
                        <Button asChild className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                          <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                          </a>
                        </Button>
                      )}
                      {tgLink && (
                        <Button asChild variant="outline" className="rounded-xl">
                          <a href={tgLink} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                            <Send className="mr-1.5 h-4 w-4 text-sky-500" /> Telegram
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-semibold text-foreground">No services listed yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Contact {listing.title} directly to ask what is available.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {whatsappNumber && (
                <Button asChild className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${listing.title}, I found your profile on Honeybee. Could you please tell me what services you currently offer?` )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {telegramUsername && (
                <Button asChild variant="outline" className="rounded-xl">
                  <a
                    href={`https://t.me/${encodeURIComponent(telegramUsername)}?text=${encodeURIComponent(`Hello ${listing.title}, I found your profile on Honeybee. Could you please tell me what services you currently offer?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                  >
                    <Send className="mr-1.5 h-4 w-4 text-sky-500" /> Telegram
                  </a>
                </Button>
              )}
              {!whatsappNumber && !telegramUsername && (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" /> The provider has not added a messaging contact yet.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
