import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "",


  pg: {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  },
};

if (!config.jwtSecret) {
  if (config.nodeEnv === "production") {
    throw new Error("JWT_SECRET must be set in production environment");
  }

  console.warn(
    "WARNING: JWT_SECRET is not set. Authentication will not work correctly. Set JWT_SECRET in your .env file."
  );
}