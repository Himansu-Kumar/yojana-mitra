import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assistantApi } from "./api.js";
import { useSpeech } from "./useSpeech.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Button, ErrorNote, PageHeader } from "../../shared/ui/index.jsx";

const TEXT = {
  en: {
    placeholder: "Ask about any scheme…",
    send: "Send",
    listen: "Speak",
    listening: "Listening…",
    readAloud: "Read answers aloud",
    suggestions: ["Which schemes can I get?", "Is there any pension for me?", "What documents do I need for PM-KISAN?"],
    offline: "AI assistant is offline; showing a simple list.",
    sources: "Schemes mentioned",
  },
  hi: {
    placeholder: "किसी भी योजना के बारे में पूछें…",
    send: "भेजें",
    listen: "बोलें",
    listening: "सुन रहे हैं…",
    readAloud: "जवाब पढ़कर सुनाएँ",
    suggestions: ["मुझे कौन सी योजनाएँ मिल सकती हैं?", "क्या मेरे लिए कोई पेंशन है?", "PM-KISAN के लिए कौन से कागज़ चाहिए?"],
    offline: "AI सहायक अभी बंद है; सरल सूची दिखा रहे हैं।",
    sources: "बताई गई योजनाएँ",
  },
};

export default function AssistantPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [language, setLanguage] = useState(user?.profile?.preferredLanguage === "hi" ? "hi" : "en");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(params.get("q") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [readAloud, setReadAloud] = useState(false);
  const endRef = useRef(null);
  const { canListen, canSpeak, listening, listen, stop, speak } = useSpeech(language);
  const t = TEXT[language];

  // Braces matter: newer browsers return a Promise from scrollIntoView, and an effect may only return a cleanup function
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await assistantApi.ask({ message, language, history });
      setMessages((m) => [...m, { role: "assistant", content: res.answer, citations: res.citations, source: res.source }]);
      if (readAloud) speak(res.answer);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Ask Mitra">Ask in English or Hindi, by typing or speaking. Answers come from our scheme list.</PageHeader>
        <div className="inline-flex overflow-hidden rounded-lg border border-line" role="radiogroup" aria-label="Language">
          {[
            ["en", "English"],
            ["hi", "हिन्दी"],
          ].map(([v, label]) => (
            <button
              key={v}
              role="radio"
              aria-checked={language === v}
              onClick={() => setLanguage(v)}
              className={`px-3 py-1.5 text-sm ${language === v ? "bg-ink text-white" : "bg-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-80 space-y-4 rounded-xl border border-line bg-white p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {t.suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-brand-600">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm text-white">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[90%]">
              <div className="whitespace-pre-line rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3 text-sm leading-relaxed">{m.content}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                {m.source === "fallback" && <span className="text-amber-700">{t.offline}</span>}
                {m.citations?.length > 0 && <span className="text-muted">{t.sources}:</span>}
                {m.citations?.map((slug) => (
                  <Link key={slug} to={`/schemes/${slug}`} className="rounded border border-line bg-white px-1.5 py-0.5 hover:border-brand-600">
                    {slug}
                  </Link>
                ))}
                {canSpeak && (
                  <button onClick={() => speak(m.content)} className="text-brand-700 hover:underline">
                    🔊
                  </button>
                )}
              </div>
            </div>
          )
        )}
        {busy && <div className="text-sm text-muted">…</div>}
        <div ref={endRef} />
      </div>

      <div className="mt-3">
        <ErrorNote error={error} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? t.listening : t.placeholder}
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
          aria-label={t.placeholder}
        />
        {canListen && (
          <Button
            type="button"
            variant={listening ? "primary" : "secondary"}
            onClick={() => (listening ? stop() : listen((text) => send(text)))}
            aria-pressed={listening}
          >
            🎤 {listening ? t.listening : t.listen}
          </Button>
        )}
        <Button type="submit" disabled={busy || !input.trim()}>
          {t.send}
        </Button>
      </form>

      {canSpeak && (
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} />
          {t.readAloud}
        </label>
      )}
    </div>
  );
}
