# Yojana Mitra (योजना मित्र)

**An AI welfare navigator.** Yojana Mitra finds the government schemes a citizen is eligible for, explains *why* (including "near misses"), reads their documents to fill in the profile, and answers questions by voice in Hindi or English.

> Built for NITSHACKS 9.0 by Team Ethanol. Inspired by MySarkar by Team AKAASHVANI (MIT License, © 2025 Koustav Bera).

## What works today (prototype)

| Feature | Where |
|---|---|
| Sign up / sign in, citizen profile | `server/src/modules/auth`, `users` · `client/src/features/auth`, `profile` |
| **Explainable eligibility engine**: eligible / near miss / needs info / not eligible, with a reason for every condition | `server/src/modules/eligibility` |
| **Benefit Wallet**: yearly cash, one-time support and insurance cover you qualify for | `client/src/features/eligibility` |
| **Fill profile from a document** (Aadhaar, income certificate) | `ml-service/app/services/ocr_service.py` · `client/src/features/documents` |
| **AI assistant** in English and Hindi, with voice in/out, citing schemes | `ml-service/app/services/chat_service.py` · `client/src/features/assistant` |
| Scheme search + filters + life events (30 central schemes) | `server/src/modules/schemes` · `data/schemes.json` |

Planned next (stubs exist): semantic search, AI rule extractor + admin review, Scam Shield, application tracker, official dashboard, IVR, WhatsApp. See [docs/build-guide.md](docs/build-guide.md).

## Run it locally

**Needs:** Node 20+, Python 3.11+ (for the AI features).

```bash
# 1. Install JS dependencies (client + server)
npm install

# 2. Start server + client
npm run dev
```
Open http://localhost:5173 and use one of the demo accounts on the sign-in page (password `demo1234`).

With no `server/.env`, the server uses a **temporary in-memory database** and loads the schemes and demo users automatically. The very first start downloads a MongoDB binary (~600 MB, one time only), so give it a few minutes. To keep data, copy `server/.env.example` to `server/.env` and set `MONGO_URI` to your MongoDB Atlas string, then run `npm run seed`.

### AI features (document reading + assistant)
```bash
cd ml-service
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then put your GEMINI_API_KEY in it
uvicorn app.main:app --reload --port 8000
```
Without the ML service the app still runs: the assistant answers with a simple list, and document reading shows a clear error.

### Tests
```bash
npm test                         # server: eligibility engine + scheme data checks
cd ml-service && pytest          # ml-service
```

## Project layout

```
client/      React + Vite + Tailwind      one folder per feature in src/features/
server/      Express + MongoDB            one folder per module in src/modules/
ml-service/  FastAPI (Gemini)             stateless; only the server calls it
data/        scheme seed data + rules
channels/    IVR + WhatsApp (planned)
docs/        API contract, architecture, decisions, build guide
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first PR.

## Disclaimer
Yojana Mitra is not a government website. Scheme data in `data/schemes.json` was written by hand for the prototype and must be verified against official sources before use.
