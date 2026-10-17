import { z } from "zod";

export const RULE_NAMES = [
  "VELOCITY_SPIKE",
  "AMOUNT_ANOMALY",
  "BLOCKED_COUNTRY",
  "CARD_TESTING_PATTERN",
];

const countryCode = z.string().trim().length(2).toUpperCase();

export const transactionSchema = z.object({
  userId: z.string().trim().min(1).max(64),
  amount: z.number().positive().max(1_000_000),
  ip: z.string().trim().max(45).optional(),
  billingCountry: countryCode.optional(),
  cardToken: z.string().trim().max(128).optional(),
  mlFeatures: z
    .object({
      time: z.number().min(0),
      v: z.array(z.number()).length(28),
    })
    .optional(),
});

export const demoSchema = z.object({
  scenario: z.enum(["normal", "ml_fraud", "blocked_country", "card_testing"]),
});

export const ruleUpdateSchema = z
  .object({
    velocityMaxTxPerWindow: z.number().int().min(1).max(100),
    velocityWindowSeconds: z.number().int().min(1).max(3600),
    amountAnomalyMultiplier: z.number().min(1).max(100),
    blockedCountries: z.array(countryCode).max(100),
    cardTestingSmallAmountMax: z.number().min(0).max(100),
    cardTestingCountThreshold: z.number().int().min(1).max(100),
    reviewThreshold: z.number().int().min(1).max(100),
    blockThreshold: z.number().int().min(1).max(100),
    mlBlockThreshold: z.number().min(0.5).max(1),
    hardBlockRules: z.array(z.enum(RULE_NAMES)),
    enabled: z.object({
      velocity: z.boolean(),
      amountAnomaly: z.boolean(),
      geoFence: z.boolean(),
      cardTesting: z.boolean(),
    }),
  })
  .partial()
  .refine(
    (d) =>
      d.reviewThreshold === undefined ||
      d.blockThreshold === undefined ||
      d.reviewThreshold < d.blockThreshold,
    {
      message: "reviewThreshold must be lower than blockThreshold",
      path: ["reviewThreshold"],
    },
  );
