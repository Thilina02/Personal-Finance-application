import dotenv from "dotenv";

dotenv.config();

function parseMysqlDatabaseUrl(databaseUrl: string): {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
} {
  const url = new URL(databaseUrl);

  // Support mysql://user:pass@host:3306/dbname
  if (url.protocol !== "mysql:") {
    throw new Error(
      `Unsupported DATABASE_URL protocol "${url.protocol}". Expected "mysql:".`
    );
  }

  const database = url.pathname?.replace(/^\//, "") || undefined;
  return {
    host: url.hostname || undefined,
    port: url.port ? Number(url.port) : undefined,
    user: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database,
  };
}

const databaseUrl = process.env.DATABASE_URL;
const parsedDbFromUrl = databaseUrl
  ? parseMysqlDatabaseUrl(databaseUrl)
  : undefined;

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || parsedDbFromUrl?.host || "localhost",
    port:
      (process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined) ||
      parsedDbFromUrl?.port ||
      3306,
    user: process.env.DB_USER || parsedDbFromUrl?.user || "root",
    password: process.env.DB_PASSWORD || parsedDbFromUrl?.password || "",
    database: process.env.DB_NAME || parsedDbFromUrl?.database || "personal_finance",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev_jwt_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
};

