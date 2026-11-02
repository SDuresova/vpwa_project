# VPWA – chat aplikácia v štýle Slack

Semestrálny projekt z predmetu Vývoj progresívnych webových aplikácií (FIIT STU).

- `frontend/` – Quasar (Vue 3 + TypeScript), SPA/PWA klient
- `backend/` – AdonisJS (TypeScript), REST API + websockety
- databáza – MySQL

## Požiadavky

- Node.js 22+
- MySQL (napr. XAMPP / Laragon)

## Spustenie

### 1. Databáza

V MySQL vytvor databázu:

```sql
CREATE DATABASE vpwa_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # doplň DB_USER, DB_PASSWORD...
node ace generate:key
node ace migration:run
npm run dev               # http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
npm install
npx quasar dev            # http://localhost:9000
```

Backend aj frontend musia bežať súčasne (dva terminály).

## Užitočné príkazy (backend)

| Príkaz | Popis |
|---|---|
| `node ace migration:run` | spustí nové migrácie |
| `node ace migration:fresh` | zmaže všetky tabuľky a spustí migrácie nanovo |
| `node ace db:seed` | naplní DB testovacími dátami |
| `node ace list` | zoznam všetkých príkazov |

## Autori

- …
- …