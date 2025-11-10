import { z } from "zod";

import { ONBOARDING_ORGANIZATION_INTENT } from "./onboarding-organization-consants";

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 72;
const ONE_MB = 1_000_000;

const REFERRAL_SOURCE_OPTIONS = [
  "searchEngine",
  "socialMedia",
  "colleagueReferral",
  "industryEvent",
  "blogArticle",
  "podcast",
  "onlineAd",
  "partnerReferral",
  "productHunt",
  "wordOfMouth",
  "other",
] as const;

const COMPANY_TYPE_OPTIONS = [
  "startup",
  "midMarket",
  "enterprise",
  "agency",
  "nonprofit",
  "government",
] as const;

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
] as const;

z.config({ jitless: true });

export const onboardingOrganizationSchema = z.object({
  companySize: z.enum(COMPANY_SIZE_OPTIONS).optional(),
  companyTypes: z.array(z.enum(COMPANY_TYPE_OPTIONS)).optional(),
  earlyAccessOptIn: z.boolean().default(false),
  intent: z.literal(ONBOARDING_ORGANIZATION_INTENT),
  logo: z
    .file()
    .max(ONE_MB, { message: "onboarding:organization.errors.logoTooLarge" })
    .mime(["image/png", "image/jpeg", "image/gif", "image/webp"], {
      message: "onboarding:organization.errors.invalidFileType",
    })
    .optional(),
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "onboarding:organization.errors.nameMin",
    })
    .max(MAX_NAME_LENGTH, {
      message: "onboarding:organization.errors.nameMax",
    }),
  recruitingPainPoint: z.string().default(""),
  referralSources: z.array(z.enum(REFERRAL_SOURCE_OPTIONS)).optional(),
  website: z.url().optional().or(z.literal("")).default(""),
});

export { COMPANY_SIZE_OPTIONS, COMPANY_TYPE_OPTIONS, REFERRAL_SOURCE_OPTIONS };
