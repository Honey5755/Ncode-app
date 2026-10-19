# Instructions for AI coding assistants

This repo is the **web (`frontend/`) and mobile (`mobile/`) client** of the Ncode Field Force platform.
The backend is hosted separately and is **not in this repo and must not be changed or recreated**.

- Read `API_GUIDE.md` first: base URL, JWT login/refresh flow, endpoints, limits.
- API base URL comes from `.env`: `VITE_API_URL` (frontend), `EXPO_PUBLIC_API_URL` (mobile). Never hardcode it. If `.env` is missing, copy `.env.example`.
- Do not add backend code, a local backend, database access, or API keys. Auth is username/password -> JWT only.
- Do not commit `.env` files or credentials. The test accounts are the Direct Login buttons on the login screens.
- All developers share one hosted database: don't write scripts that bulk-create, edit or delete data. Use your own dev login for testing.
- Mobile (Expo SDK 57): use `npx expo install <pkg>` for dependencies, keep it runnable in Expo Go (no custom native modules), and run `npx tsc --noEmit` before finishing. Web: run `npm run build` before finishing.
- If a feature needs a new or changed endpoint, say so in your answer and stop; the backend owner adds it.
