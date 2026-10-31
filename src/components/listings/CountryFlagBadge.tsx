import Image from "next/image";

const COUNTRY_CODES: Record<string, string> = {
  Uganda: "ug",
  Kenya: "ke",
  Tanzania: "tz",
  "Democratic Republic of the Congo": "cd",
  Rwanda: "rw",
  Burundi: "bi",
  "South Sudan": "ss",
};

/** Inline 16px flag for text lines (photo cards use the overlay badge). */
export function CountryFlagIcon({ country }: { country?: string | null }) {
  if (!country) return null;
  const countryCode = COUNTRY_CODES[country];
  if (!countryCode) return null;

  return (
    <Image
      src={`https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg`}
      alt={country}
      title={country}
      width={18}
      height={14}
      unoptimized
      className="inline-block h-3.5 w-[18px] shrink-0 rounded-[2px] object-cover align-middle"
    />
  );
}

export function CountryFlagBadge({ country }: { country?: string | null }) {
  if (!country) return null;
  const countryCode = COUNTRY_CODES[country];
  if (!countryCode) return null;

  return (
    <span
      title={country}
      className="absolute bottom-3 right-3 z-10 inline-flex items-center rounded-full border border-white/30 bg-black/65 p-1.5 shadow-sm backdrop-blur sm:bottom-4 sm:right-4"
    >
      <Image
        src={`https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg`}
        alt={country}
        width={22}
        height={16}
        unoptimized
        className="h-4 w-[22px] shrink-0 rounded-[3px] object-cover"
      />
    </span>
  );
}
