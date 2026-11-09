# channels/ (planned: Step 10)

Extra ways to reach Yojana Mitra, reusing the same server APIs.

## `ivr/`: phone calls for keypad phones
- Twilio Voice webhook → language menu (DTMF) → a few profile questions → top 3 eligible schemes read out → SMS with details.
- Should call the server's eligibility and chat services, not duplicate them.
- Likely shape: a server module `server/src/modules/channels/ivr.routes.js` exposing `/api/channels/ivr/*` for Twilio.

## `whatsapp/`: WhatsApp bot
- WhatsApp Business API webhook → same `/chat` flow, voice notes through ml-service `/voice/stt`.

Keep any channel-specific scripts, call-flow diagrams and test recordings in these folders.
