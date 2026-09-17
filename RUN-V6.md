# RIMBARA AI V6 — AI Backend

## 1. Requirements
- Node.js 20+ recommended
- An OpenAI API key

## 2. Install
```bash
cd server
npm install
```

## 3. Configure
Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.

## 4. Run
```bash
npm start
```

Open the frontend through a web server that proxies `/api` to this server (or serve the frontend from the same Express app).

## Important
Never put the API key in `index.html`, GitHub, or a public frontend bundle. The backend keeps the key server-side.
