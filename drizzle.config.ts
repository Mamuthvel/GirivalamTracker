import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_k78xVIAuhLgz@ep-muddy-night-a8mvylij-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
