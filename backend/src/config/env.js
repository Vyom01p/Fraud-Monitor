import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    ML_SERVICE_URL: z.string().url().default("http://127.0.0.1:8000"),
    ML_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    INGEST_API_KEY: z.string().optional(),
    ADMIN_API_KEY: z.string().optional(),
    ML_API_KEY: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== "production") return;
    for (const key of ["INGEST_API_KEY", "ADMIN_API_KEY"]) {
      if (!val[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required in production",
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CLIENT_ORIGINS: parsed.data.CLIENT_URL.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
