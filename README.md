Geonyx device management

## Local setup

1. Configure `backend/.env` and `frontend/.env` from the example files.
2. Sync the local database:

```bash
npm run db:push
npm run seed
```

3. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:3000`
Backend health: `http://localhost:4000/health`

Seeded logins:

- Admin: `admin@geonyx.dev` / `Admin@1234`
- User: `user@geonyx.dev` / `User@1234`
