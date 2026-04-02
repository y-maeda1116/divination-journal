import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DEEPL_AUTH_KEY: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${missing}`);
}

export const config = result.data;
