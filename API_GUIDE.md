# Backend API: guide for frontend developers

You do **not** need the backend code. Use the hosted API:

**Base URL:** `https://ncode-backend.vercel.app/api`

There is no API key. Every request (except login/register/refresh) needs a JWT:

1. `POST /auth/login/` with `{"username": "...", "password": "..."}` returns `{access, refresh}`.
2. Send `Authorization: Bearer <access>` on every call. The access token lasts 15 minutes.
3. When it expires, `POST /auth/refresh/` with `{"refresh": "..."}` returns a new `access` and a new `refresh` (the old refresh stops working). `mobile/src/services/api.ts` and `frontend/src/services/api.ts` already do this.

Ask the backend owner for a **personal dev account**. Don't share or change the demo accounts.

## Run the apps against it
```bash
# web
cd frontend && cp .env.example .env && npm install && npm run dev     # http://localhost:5173
# mobile (Expo Go)
cd mobile && cp .env.example .env && npm install && npx expo start
```
`.env` is git-ignored. If the owner sends you a `.env`, drop it in the same folder instead of copying the example.

## Endpoints
| Endpoint | Who | Purpose |
|---|---|---|
| `POST auth/register/` · `auth/login/` · `auth/refresh/` · `GET auth/me/` | public / any | JWT auth |
| `POST attendance/punch-in/` (multipart: selfie, latitude, longitude, accuracy) | staff | Start session |
| `POST attendance/punch-out/` | staff | End session |
| `GET attendance/current/` · `history/` | staff | Own session / history |
| `GET/POST attendance/visits/` · `PATCH attendance/visits/<id>/` · `POST attendance/visits/<id>/photos/` | staff | Field visits |
| `GET/POST attendance/leaves/` · `holidays/` · `notes/` · `documents/` | staff | Leave, holidays, notes, documents |
| `POST locations/` · `GET locations/?session=<id>` | staff | Location points |
| `GET tracking/config/` · `POST tracking/events/` | staff | Tracking config / events |
| `GET admin/summary/` · `live/` · `sessions/` · `visits/` · `leaves/` · `users/` | admin / manager | Portal data (managers: per-screen permissions from `auth/me/`) |

Lists are either a plain array or `{count, next, previous, results}`; handle both.
Files (selfies, photos, documents) are only served through authenticated endpoints; send the Bearer header.
Rate limits: 600 requests/min per user, 60/min anonymous.

## Notes
- Native mobile apps are not affected by CORS. Browser apps must run on an allowed origin: `localhost` ports 3000, 5173, 5174, 8081, 19006. Ask the owner to add others.
- No WebSockets on this host: poll `admin/live/` (the web's live feed won't connect).
- Cold start: the first request after a quiet period can take a few seconds.
- Found a backend bug or need an endpoint? Tell the backend owner; the backend is not part of this repo.
