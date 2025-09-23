import {z} from 'zod'
import dotenv from 'dotenv'

dotenv.config({quiet:true})

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    IG_CLIENT_ID:z.string().min(1,"IG_CLIENT_ID is required"),
    IG_CLIENT_SECRET:z.string().min(1, "IG_CLIENT_SECRET is required"),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
    SERVER_URL: z.string().url("SERVER_URL must be a valid URL"),
    WEBHOOK_VERIFY_TOKEN: z.string().min(1, "WEBHOOK_VERIFY_TOKEN is required"),
    USE_TEMPLATES: z.string().default("false"),
  });


export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (issue) => `❌ ${issue.path.join(".")}: ${issue.message}`
      );

      console.error("\n🚨 Environment validation failed:");
      console.error(missingVars.join("\n"));

      process.exit(1);
    }

    throw error;
  }
}

export const env = validateEnv();

