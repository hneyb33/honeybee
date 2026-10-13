export type SitePageSlug = "faqs" | "privacy" | "terms" | "disclaimer";

export interface SitePageContent {
  slug: SitePageSlug;
  title: string;
  content: string;
}

export const SITE_PAGES: SitePageContent[] = [
  {
    slug: "faqs",
    title: "Frequently asked questions",
    content: `How do I find a provider?
Browse the directory and use the location and service filters to find profiles that match what you are looking for.

What does a verified profile mean?
A verification badge means the profile has passed Honeybee's review process. It is not a guarantee of identity, conduct, or service quality.

Who can use Honeybee?
Honeybee is for adults aged 18 and older. Users must follow the platform terms and all applicable laws.

How can I get help?
Contact the Honeybee support team using the contact details in the footer.`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    content: `Honeybee ("we", "our", or "the platform") is committed to protecting your privacy. This policy describes how account data and information submitted to Honeybee are handled.

Identity verification documents
Identity documents and background information submitted for verification are used by authorized Honeybee administrators for review and fraud prevention. They are not intended for public display.

Client data and discretion
We limit the personal information shown on public profiles. Please avoid sharing sensitive personal information through public profile fields.

Cookies and age gate
Honeybee may use browser storage and cookies for age-gate preferences, session authentication, and site settings.`,
  },
  {
    slug: "terms",
    title: "Terms of service",
    content: `By accessing, browsing, or listing on Honeybee, you agree to follow these terms and any applicable laws.

Eligibility
You must be at least 18 years old to access or use Honeybee.

Independent providers
Providers listed on Honeybee are independent and are not employees or agents of Honeybee. Users and providers are responsible for their own arrangements.

Subscriptions and payments
Any applicable fees, payment instructions, and subscription terms are shown during the relevant transaction. Users should review those details before paying.`,
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    content: `Honeybee is a discovery and advertising platform. Information in profiles and advertisements is supplied by account holders. A review or verification badge is not a guarantee of identity, conduct, qualifications, or service quality.

Independent providers
Providers are independent and are not employees, agents, or representatives of Honeybee. Any arrangement or payment between a user and a provider is made at their own discretion.

User responsibility
Honeybee is intended only for adults aged 18 or older. Users are responsible for complying with applicable laws and making their own decisions based on available information.

No professional advice or emergency service
Content on Honeybee is general information, not legal, medical, or financial advice. Honeybee is not an emergency service. Contact appropriate local emergency services if you are in immediate danger.

This disclaimer does not limit any rights or obligations that cannot lawfully be excluded.`,
  },
];

export function getDefaultSitePage(slug: SitePageSlug): SitePageContent {
  const page = SITE_PAGES.find((item) => item.slug === slug);
  if (!page) throw new Error(`No default content is defined for "${slug}".`);
  return page;
}
