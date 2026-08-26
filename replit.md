# Pillar UI

Pillar is a React/Vite productivity dashboard with a Django REST API for authentication and personal productivity data.

## Run locally on Replit

The project uses two workflows:

- **Start application**: `npm run dev` on port 5000 for the React frontend.
- **Django API**: runs migrations, seeds the demo account, and starts Django on port 8000.

The Vite development server proxies `/api` requests to the Django service, so the frontend can be opened through the Replit preview without a hardcoded local API host.

## Backend

The backend lives in `backend/` and uses SQLite for development. Run these commands from the project root when needed:

```bash
.pythonlibs/bin/python backend/manage.py migrate
.pythonlibs/bin/python backend/manage.py seed_demo
.pythonlibs/bin/python backend/manage.py runserver 0.0.0.0:8000
```

The demo account is `demo` with password `pillar123`.

Available API areas:

- `/api/auth/` — registration, JWT login/refresh, and profile
- `/api/tasks/` — tasks, lists, and tags
- `/api/habits/` — habits, daily completion toggles, and heatmaps
- `/api/faith/` — prayers, adhkar, Quran progress, and good deeds
- `/api/focus/` — focus session logging and analytics

`SESSION_SECRET` is used for Django’s signing key when available. Do not commit environment files or credentials.