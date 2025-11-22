const { Pool } = require('pg');
require('dotenv').config();

// Support either a full DATABASE_URL or individual PG* env vars.
const useConnectionString = Boolean(process.env.DATABASE_URL);
const shouldUseSSL =
  process.env.PGSSLMODE === 'require' ||
  process.env.PGSSLMODE === 'verify-full' ||
  process.env.PGSSL === 'true';

const pool = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined
      }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined
      }
);

module.exports = {
  query: (text, params) => pool.query(text, params)
};

