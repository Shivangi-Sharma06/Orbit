# Geonyx

GPS device management platform built with Next.js, Express, Prisma/PostgreSQL, Mantine, Socket.IO, Leaflet, QR claim flows, and JWT auth.

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run seed
npm run dev
```

Backend runs on `http://localhost:4000`; frontend runs on `http://localhost:3000`.

Seed users:

- `admin@geonyx.dev` / `Admin@1234`
- `user@geonyx.dev` / `User@1234`
