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

export function CountryFlagBadge({ country }: { country?: string | null }) {
  if (!country) return null;
  const countryCode = COUNTRY_CODES[country];
  if (!countryCode) return null;

  return (
    <span className="absolute bottom-3 right-3 z-10 inline-flex max-w-[70%] items-center gap-1.5 rounded-full border border-white/30 bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur sm:bottom-4 sm:right-4">
      <Image
        src={`https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg`}
        alt=""
        aria-hidden="true"
        width={18}
        height={14}
        unoptimized
        className="h-3.5 w-[18px] shrink-0 rounded-[2px] object-cover"
      />
      <span className="truncate">{country}</span>
    </span>
  );
}
