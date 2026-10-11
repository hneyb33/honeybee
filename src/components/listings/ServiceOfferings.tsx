import React from "react";
import { ProfileOffering } from "@/lib/supabase/types";
import { formatUGX } from "@/lib/utils";
import { Clock, MapPin, CheckCircle2 } from "lucide-react";

interface ServiceOfferingsProps {
  offerings?: ProfileOffering[];
  generalServices?: string[];
}

export function ServiceOfferings({
  offerings,
  generalServices,
}: ServiceOfferingsProps) {
  if (offerings && offerings.length > 0) {
    // Group offerings by group_name
    const groups = offerings.reduce((acc, item) => {
      acc[item.group_name] = acc[item.group_name] || [];
      acc[item.group_name].push(item);
      return acc;
    }, {} as Record<string, ProfileOffering[]>);

    return (
      <section className="border-b border-border py-8">
        <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground">
          Services &amp; Packages
        </h3>
        <div className="space-y-6">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {groupName}
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {items.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/30 shadow-sm"
                  >
                    <div>
                      <h5 className="font-semibold text-foreground text-sm">
                        {service.name}
                      </h5>
                      <p className="mt-1 text-base font-bold text-airbnb-coral">
                        {formatUGX(service.price)}
                        {service.pricing_model && (
                          <span className="text-xs font-normal text-muted-foreground ml-1.5">
                            • {service.pricing_model}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {service.location_type && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {service.location_type}
                        </span>
                      )}
                      {service.turnaround && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {service.turnaround}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (generalServices && generalServices.length > 0) {
    return (
      <section className="border-b border-border py-8">
        <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground">
          What is offered
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {generalServices.map((service, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-sm font-medium text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-airbnb-coral shrink-0" />
              <span>{service}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return null;
}
