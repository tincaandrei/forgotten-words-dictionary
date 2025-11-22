# Forgotten Words Dictionary

Small full-stack app for capturing and sharing family-only words. A shared access code gates entry; once inside, anyone can browse the dictionary, search entries, and add new words with definitions and examples. Light/dark themes are built in.

## Stack
- Backend: Node.js, Express, PostgreSQL
- Frontend: React (create-react-app), React Router

## Prerequisites
- Node.js and npm
- PostgreSQL database (local or hosted, e.g., Neon)

## Setup
1) Clone or open the repo:
```
git clone <this-repo>
cd forgotten-words-dictionary
```

2) Backend install:
```
cd backend
npm install
```

3) Backend environment:
Create `backend/.env` (or copy values from the root `.env`) with your Postgres settings and access code. Example:
```
PORT=4000
FAMILY_ACCESS_CODE=choose-a-shared-code
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=forgotten_words
PGSSLMODE=require
```

4) Create the database table:
```
# adjust connection flags as needed
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f schema.sql
```

5) Run the backend:
```
npm start          # or: npm run dev (with nodemon)
```
The API listens on `http://localhost:4000` by default and expects requests from the frontend origin `http://localhost:3000` (configurable via `CORS_ORIGIN`).

6) Frontend install:
```
cd ../frontend
npm install
```
Optional: set a custom API URL by creating `frontend/.env`:
```
REACT_APP_API_BASE_URL=http://localhost:4000
```

7) Run the frontend:
```
npm start
```
This serves the app at `http://localhost:3000`. Keep the backend running in another terminal.

## How it works
- Access gate: Users must enter the shared `FAMILY_ACCESS_CODE` plus their name. Success is stored in `localStorage`.
- Name tracking: The entered name is cached for 2 hours, after which the app asks again.
- Browse: Lists all stored words (term, definition, examples, author, timestamp).
- Search: Client-side filtering across terms and definitions.
- Add word: Submit a term, definition, and optional examples; entries are saved with the current user's name.
- Theme: Toggle between light and dark; preference is persisted locally.

## API (overview)
- `POST /api/check-access` - body `{ accessCode }`; compares to `FAMILY_ACCESS_CODE`.
- `GET /api/words` - returns all words ordered by creation date.
- `POST /api/words` - body `{ term, definition, examples?, created_by }`; stores a new entry.

## Docker & Render workflow
- Backend (Docker): Dockerfile lives in `backend/`. Render Web Service can auto-detect it. Locally: `docker build -t forgotten-backend ./backend` and run with `docker run --env-file .env -p 4000:4000 forgotten-backend`.
- Compose: `docker-compose up --build` starts the backend using the remote Neon database (reads the root `.env`).
- Frontend (Render Static Site): Build command `npm run build`; publish directory `build`; set `REACT_APP_API_BASE_URL` to your backend URL. No Docker needed for the frontend on Render.
- Database (Neon): Use the connection string from `.env` (or `DATABASE_URL`). On Render, set `DATABASE_URL` or the individual `PG*` vars plus `FAMILY_ACCESS_CODE`. Neon requires SSL; `PGSSLMODE=require` is included.
- Keep-awake tip: Render free tier may sleep; ping the backend (e.g., via cron-job.org) every ~10 minutes to reduce cold starts.

## Notes
- If you deploy the frontend somewhere other than `http://localhost:3000`, set `CORS_ORIGIN` accordingly (environment variable read by the backend).
- `.env` files are git-ignored; keep your secrets there.
