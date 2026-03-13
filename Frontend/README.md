## Frontend (Next.js) - Personal Finance Dashboard

This app is the UI for the Personal Finance & Budget Tracking Application.

### Available routes

- `/auth/register` – user registration
- `/auth/login` – login
- `/dashboard` – main dashboard (summary + insights)
- `/transactions` – income & expense CRUD
- `/categories` – manage categories
- `/budgets` – manage budgets

All main routes except auth are protected and require a valid login (JWT stored in `localStorage`).

### Running locally

In this `Frontend` folder:

```bash
npm install
npm run dev
```

The app expects the backend API at `http://localhost:4000/api` by default.
You can override this via `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

