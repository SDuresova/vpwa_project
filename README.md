# VPWA – chat aplikácia v štýle Slack

Semestrálny projekt z predmetu Vývoj progresívnych webových aplikácií (FIIT STU).

- `frontend/` – Quasar (Vue 3 + TypeScript), SPA/PWA klient
- `backend/` – AdonisJS (TypeScript), REST API + websockety
- databáza – MySQL

Implementované požiadavky, príkazy a postup overenia: [REQUIREMENTS.md](REQUIREMENTS.md).

## Požiadavky

- Node.js 22+
- MySQL (napr. XAMPP / Laragon)

## Spustenie

### Každodenné spustenie jedným príkazom

V XAMPP zapni **MySQL**. Potom v priečinku `project/` spusti:

```bash
npm start
```

Tento príkaz spustí backend aj frontend v jednom termináli. Aplikáciu otvor na
http://localhost:9000. Oba servery zastavíš pomocou `Ctrl+C`.
Ak už bežia v samostatných termináloch, najprv ich zastav.

Po novom stiahnutí projektu nainštaluj závislosti príkazom `npm run setup`
a vykonaj jednorazové nastavenie databázy a backendu uvedené nižšie.

### Zobrazenie databázy

V XAMPP zapni **Apache** aj **MySQL** a otvor http://localhost/phpmyadmin/.
Vľavo vyber databázu podľa `DB_DATABASE` v `backend/.env`, potom tabuľku
`users` a kartu **Browse / Prechádzať**. Tu uvidíš registrovaných používateľov.
Heslá sú uložené ako hash. Apache je potrebný pre phpMyAdmin, nie pre samotnú aplikáciu.

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
