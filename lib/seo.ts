export const SITE_URL = "https://www.wobanalysis.com";
export const SITE_NAME = "WOB Analysis";

export const DEFAULT_TITLE =
  "WOB Analysis | AI YouTube Monetization & Compliance Checker";

/** Keep under 160 characters for SERP snippets. */
export const DEFAULT_DESCRIPTION =
  "WOB Analysis: AI YouTube monetization checker. Scan yellow-dollar, profanity, copyright, and advertiser-friendly risks before you upload.";

export const SEO_KEYWORDS = [
  "WOB Analysis",
  "YouTube monetization checker",
  "YouTube demonetization checker",
  "advertiser-friendly guidelines scanner",
  "video compliance audit",
  "AI video compliance audit",
  "YouTube yellow dollar sign",
  "YouTube limited ads checker",
  "YouTube policy scanner",
  "monetization risk scanner",
  "YouTube profanity checker",
  "advertiser friendly content guidelines",
] as const;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "en-US",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": ["SoftwareApplication", "WebApplication"],
      name: SITE_NAME,
      url: SITE_URL,
      image: `${SITE_URL}/opengraph-image.png`,
      description: DEFAULT_DESCRIPTION,
      applicationCategory: "MultimediaApplication",
      additionalType: "https://schema.org/BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      provider: { "@id": ORGANIZATION_ID },
      featureList: [
        "YouTube monetization checker",
        "YouTube demonetization checker",
        "Advertiser-friendly guidelines scanner",
        "AI video compliance audit",
        "Profanity and policy timestamp reports",
      ],
      offers: [
        {
          "@type": "Offer",
          name: "7-day free trial",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: SITE_URL,
        },
        {
          "@type": "Offer",
          name: "Starter",
          price: "10.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: SITE_URL,
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "19.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: SITE_URL,
        },
        {
          "@type": "Offer",
          name: "Max",
          price: "45.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: SITE_URL,
        },
      ],
    },
  ],
} as const;
