# Ncode Field Force: web + mobile

Frontend (`frontend/`, React + Vite) and mobile app (`mobile/`, Expo) for the Ncode field attendance platform.
The backend is hosted separately and is not part of this repo. See [API_GUIDE.md](API_GUIDE.md) for the API and how to log in.

```bash
# web
cd frontend && cp .env.example .env && npm install && npm run dev      # http://localhost:5173
# mobile (Expo Go)
cd mobile && cp .env.example .env && npm install && npx expo start
```
Ask the project owner for a personal dev login. Don't commit `.env` files.
