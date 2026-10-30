"use client";

import Image from "next/image";
import {
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Utensils,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EAST_AFRICAN_COUNTRIES } from "@/lib/data/uganda-locations";
import {
  DAYS,
  LANGUAGES,
  SERVICE_TYPES,
  nationalities,
  orientations,
  PORTFOLIO_HINT,
  REQUIRES_VIDEO_FOR_MODELS,
  REQUIRES_VIDEO_FOR_SPECIALISTS,
} from "./onboarding-config";
import {
  CheckboxGrid,
  Field,
  InlineAlert,
  RadioGroup,
  ReviewRow,
  SelectInput,
} from "./onboarding-ui";
import { PortfolioUploader } from "./portfolio-uploader";
import type { OnboardingController } from "./use-onboarding";

/**
 * The five wizard steps as standalone components. They are pure renderers over
 * the controller returned by `useOnboarding`, which owns all state and side
 * effects, so changing one step never touches another.
 */

export function StepAbout({ c }: { c: OnboardingController }) {
  const { form, update, isModel } = c;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Public display name">
        <Input
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder={isModel ? "e.g. Maya K." : "e.g. Chef Samuel K."}
          maxLength={120}
        />
      </Field>
      {isModel ? (
        <>
          <Field label="Age" hint="You must be at least 18.">
            <Input
              type="number"
              min={18}
              max={100}
              value={form.age}
              onChange={(event) => update("age", event.target.value)}
              placeholder="25"
            />
          </Field>
          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.ageConfirmed}
              onChange={(event) => update("ageConfirmed", event.target.checked)}
              className="h-4 w-4 accent-airbnb-coral"
            />
            I confirm that I am 18 years old or older.
          </label>
          <Field label="Gender">
            <RadioGroup
              name="onboarding-gender"
              value={form.gender}
              onChange={(value) => update("gender", value)}
              options={["Female", "Male", "Non-binary"]}
            />
          </Field>
          <Field label="Orientation (optional)">
            <SelectInput value={form.orientation} onChange={(value) => update("orientation", value)}>
              <option value="">Choose an option</option>
              {orientations.map((orientation) => (
                <option key={orientation} value={orientation}>
                  {orientation}
                </option>
              ))}
            </SelectInput>
          </Field>
        </>
      ) : (
        <>
          <Field label="Main service category">
            <SelectInput value={form.serviceType} onChange={(value) => update("serviceType", value)}>
              {SERVICE_TYPES.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Years of experience">
            <Input
              type="number"
              min={0}
              max={60}
              value={form.yearsExperience}
              onChange={(event) => update("yearsExperience", event.target.value)}
              placeholder="5"
            />
          </Field>
          <Field label="Nationality">
            <SelectInput value={form.nationality} onChange={(value) => update("nationality", value)}>
              {nationalities.map((nationality) => (
                <option key={nationality}>{nationality}</option>
              ))}
            </SelectInput>
          </Field>
        </>
      )}
    </div>
  );
}

export function StepLocation({ c }: { c: OnboardingController }) {
  const { form, update, cities, availableAreas } = c;
  const showNeighborhoodInput =
    form.neighborhood === "Other" || (!!form.neighborhood && !availableAreas.includes(form.neighborhood));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country">
          <SelectInput
            value={form.country}
            onChange={(value) => {
              const country = EAST_AFRICAN_COUNTRIES.find((item) => item.name === value);
              update("country", value);
              update("city", country?.cities[0] ?? "");
              update("neighborhood", "");
              update("whatsappCode", country?.callingCode ?? "+256");
            }}
          >
            {EAST_AFRICAN_COUNTRIES.map((country) => (
              <option key={country.name}>{country.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="City / district">
          <SelectInput
            value={form.city}
            onChange={(value) => {
              update("city", value);
              update("neighborhood", "");
            }}
          >
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Neighbourhood">
          <SelectInput
            value={availableAreas.includes(form.neighborhood) ? form.neighborhood : form.neighborhood ? "Other" : ""}
            onChange={(value) => update("neighborhood", value)}
          >
            <option value="">Choose neighbourhood</option>
            {availableAreas.map((area) => (
              <option key={area}>{area}</option>
            ))}
            <option value="Other">Other</option>
          </SelectInput>
          {showNeighborhoodInput && (
            <Input
              className="mt-2"
              value={form.neighborhood === "Other" ? "" : form.neighborhood}
              placeholder="Enter your neighbourhood"
              onChange={(event) => update("neighborhood", event.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label="Maximum travel distance">
        <RadioGroup
          name="onboarding-travel"
          value={form.travelKm}
          onChange={(value) => update("travelKm", value)}
          options={["5", "10", "20", "50", "anywhere"]}
          labels={["5 km", "10 km", "20 km", "50 km", `Anywhere in ${form.country}`]}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp number">
          <div className="flex gap-2">
            <SelectInput value={form.whatsappCode} onChange={(value) => update("whatsappCode", value)} className="w-28">
              {EAST_AFRICAN_COUNTRIES.map((country) => (
                <option key={country.callingCode}>{country.callingCode}</option>
              ))}
            </SelectInput>
            <Input
              value={form.whatsappNumber}
              onChange={(event) => update("whatsappNumber", event.target.value)}
              placeholder="700 000 000"
              inputMode="tel"
            />
          </div>
        </Field>
        <Field label="Telegram username (optional)">
          <Input
            value={form.telegram}
            onChange={(event) => update("telegram", event.target.value)}
            placeholder="@username"
          />
        </Field>
      </div>
    </div>
  );
}

export function StepServices({ c }: { c: OnboardingController }) {
  const { form, update, toggleChoice, isModel, selectedServiceOptions, modelServicesError } = c;
  return (
    <div className="space-y-5">
      {!isModel && (
        <Field label="Service category">
          <SelectInput
            value={form.serviceType}
            onChange={(value) => {
              update("serviceType", value);
              update("services", []);
            }}
          >
            {SERVICE_TYPES.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      <Field
        label={isModel ? "Hot offers" : "Services offered"}
        hint={
          isModel
            ? "Choose what you offer. Clients can discuss details and pricing with you in chat."
            : "Choose all that apply."
        }
      >
        {isModel && modelServicesError ? (
          <InlineAlert>Could not load hot offers: {modelServicesError}</InlineAlert>
        ) : selectedServiceOptions.length > 0 ? (
          <CheckboxGrid
            options={selectedServiceOptions}
            selected={form.services}
            onToggle={(service) => toggleChoice("services", service)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {isModel ? "Loading hot offers…" : "No services available for this category."}
          </p>
        )}
      </Field>
      <Field label="Languages">
        <CheckboxGrid options={LANGUAGES} selected={form.languages} onToggle={(language) => toggleChoice("languages", language)} />
      </Field>
      <Field label="Available days" hint="Select at least one day.">
        <CheckboxGrid options={DAYS} selected={form.availableDays} onToggle={(day) => toggleChoice("availableDays", day)} columns={4} />
      </Field>
      <div className="grid max-w-sm grid-cols-2 gap-4">
        <Field label="From">
          <Input type="time" value={form.from} onChange={(event) => update("from", event.target.value)} />
        </Field>
        <Field label="Until">
          <Input type="time" value={form.to} onChange={(event) => update("to", event.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function StepPortfolio({ c }: { c: OnboardingController }) {
  const { form, update, isModel } = c;
  const requireVideo = isModel ? REQUIRES_VIDEO_FOR_MODELS : REQUIRES_VIDEO_FOR_SPECIALISTS;
  return (
    <div className="space-y-5">
      <Field
        label={isModel ? "About your profile" : "About your work"}
        hint="At least 40 characters. Do not include private identity details."
      >
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={5}
          maxLength={2500}
          placeholder={
            isModel
              ? "Introduce yourself, your interests, and what clients can expect..."
              : "Tell clients about your experience, approach, and the quality of your work..."
          }
          className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/2500</div>
      </Field>

      {!isModel && (
        <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
          <input
            id="certified"
            type="checkbox"
            checked={form.certified}
            onChange={(event) => update("certified", event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-emerald-600"
          />
          <label htmlFor="certified" className="text-sm">
            <span className="font-semibold">I have relevant training or certification</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Only claim qualifications you can confirm during review.
            </span>
          </label>
        </div>
      )}

      <Field label="Portfolio photos and videos" hint={PORTFOLIO_HINT + (requireVideo ? " A video is required for your account type." : "")}>
        <PortfolioUploader
          queue={c.queue}
          existingMedia={c.existingMedia}
          onRemoveExisting={c.removeExistingMedia}
          disabled={c.saving}
        />
      </Field>
    </div>
  );
}

export function StepReview({ c }: { c: OnboardingController }) {
  const { form, isModel } = c;
  type Preview = { key: string; kind: "photo" | "video"; previewUrl: string };
  const previews: Preview[] = [
    ...c.existingMedia.map((item): Preview => ({
      key: item.id ?? item.url,
      kind: item.kind,
      previewUrl: item.cardUrl ?? item.url,
    })),
    ...c.queue.items
      .filter((item) => item.status === "processing")
      .map((item): Preview => ({
        key: item.id,
        kind: item.kind,
        previewUrl: c.queue.previewFor(item.id) ?? "",
      })),
  ].slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold">Your profile is reviewed before it is published</p>
          <p className="mt-1 text-xs">
            Only verified profiles appear in public search. Your photos and videos will be visible with the
            profile after approval.
          </p>
        </div>
      </div>
      <ReviewRow
        icon={<UserRound className="h-4 w-4" />}
        label="Profile"
        value={`${form.title}${
          isModel
            ? ` · ${form.age} years · ${form.gender}`
            : ` · ${SERVICE_TYPES.find((item) => item.value === form.serviceType)?.label ?? ""}`
        }`}
      />
      <ReviewRow
        icon={<MapPin className="h-4 w-4" />}
        label="Location"
        value={`${form.neighborhood}, ${form.city}, ${form.country} · WhatsApp ${form.whatsappCode} ${form.whatsappNumber}`}
      />
      <ReviewRow
        icon={<Sparkles className="h-4 w-4" />}
        label="Services"
        value={`${form.services.join(", ")} · ${form.languages.join(", ")}`}
      />
      <ReviewRow icon={<Utensils className="h-4 w-4" />} label="Availability" value={form.availableDays.join(", ")} />
      <div className="rounded-2xl border border-border p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">About</p>
        <p className="text-sm leading-relaxed">{form.description || "Add a description before submitting."}</p>
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((item, index) => (
            <div key={item.key} className="relative aspect-square overflow-hidden rounded-xl bg-black">
              {item.kind === "video" ? (
                <video
                  src={item.previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  aria-label={`Profile video ${index + 1}`}
                />
              ) : (
                <Image
                  src={item.previewUrl}
                  alt={`Profile photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {c.queue.hasActiveUploads && (
        <Badge variant="secondary" className="text-xs">
          Some media is still uploading. You can submit once it finishes.
        </Badge>
      )}
    </div>
  );
}
