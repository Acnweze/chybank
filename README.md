# Chybank

Chybank is a simulated banking demo. It is not designed for real money, real customer data, or production financial use.

## What is included

- React dashboard built with Vite
- Express API
- SQLite database persistence
- Demo login, registration, and password reset
- Account balance
- Hide/show balance
- Transaction history
- Card summary
- Interbank and other-bank demo transfers
- Bill payment, card request, airtime, loan, and investment requests
- Profile photo and ID document selection
- Extra account creation for Investment, Euro, Pounds, and Savings accounts

## Demo Credentials

- Email: `sarah@chybank.demo`
- Password: `demo123`

## Run Locally

Install dependencies:

```bash
npm install
```

Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Database

The backend uses a local SQLite database:

```text
backend/data/chybank.sqlite
```

The database is created and seeded automatically the first time the backend starts.
To reset demo data, stop the backend and delete the SQLite files in `backend/data/`.

## Next Steps

- Add real authentication provider for demos
- Add admin/support screen
- Add deployment environment variables
- Move SQLite to PostgreSQL or Supabase before a hosted multi-user deployment
