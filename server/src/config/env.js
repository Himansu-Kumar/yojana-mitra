import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-do-not-use-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mlServiceUrl: (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/$/, ""),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
