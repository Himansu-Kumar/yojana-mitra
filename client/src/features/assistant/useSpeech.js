import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech for the prototype (works best in Chrome / Edge).
// Later this can switch to ml-service speech endpoints (Whisper / Bhashini) without changing the page.
const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const LOCALE = { en: "en-IN", hi: "hi-IN" };

export function useSpeech(language) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => recRef.current?.abort(), []);

  const listen = useCallback(
    (onText) => {
      if (!Recognition) return;
      const rec = new Recognition();
      rec.lang = LOCALE[language] || "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => onText(e.results[0][0].transcript);
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      rec.start();
    },
    [language]
  );

  const stop = useCallback(() => recRef.current?.stop(), []);

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[•*#]/g, ""));
      u.lang = LOCALE[language] || "en-IN";
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang === u.lang);
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    },
    [language]
  );

  return { canListen: Boolean(Recognition), canSpeak: typeof window !== "undefined" && "speechSynthesis" in window, listening, listen, stop, speak };
}
