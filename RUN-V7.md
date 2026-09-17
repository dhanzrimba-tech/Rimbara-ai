# RIMBARA AI V7 — QUICK START

### 1. Server
```bash
cd server
npm install
copy .env.example .env
npm start
```
On Linux/macOS use `cp .env.example .env` instead of `copy`.

### 2. Web page
Serve `rimbara_v3` through a local web server. Do not use `file://` because microphone/WebRTC needs a secure/served origin.

Example with Python from the project root:
```bash
python -m http.server 8080 --directory rimbara_v3
```
Then open `http://localhost:8080`.

For a production deployment, serve the frontend and `/api` through the same HTTPS domain, or configure CORS/reverse proxy accordingly.

### 3. Important
The frontend calls `/api/realtime/session`. The server creates the short-lived client secret. Never put the permanent OpenAI API key in browser JavaScript.
