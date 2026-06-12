import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import {
  sendAiMessage,
  synthesizeSpeech,
  type AiChatMessage,
  type AiCartItem,
} from '../lib/api';

// Web Speech API brauzer turlari (standart lib'da yo'q — minimal e'lon)
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Matnni ovozda o'qishdan oldin markdown va belgilardan tozalaymiz
function cleanForSpeech(t: string): string {
  return t
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, ' ')
    .replace(/#+/g, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^\s*[-–—•]\s+/gm, '')
    .replace(/\s[–—]\s/g, ', ')
    .replace(/\bUZS\b/gi, "so'm")
    .replace(/\r?\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\.\s*){2,}/g, '. ')
    .trim();
}

// Jimlik chegarasi — mijoz shuncha vaqt gapirmasa mikrofon o'chadi
const SILENCE_MS = 4000;

// Bir sahifa yuklanishida bitta restoranni faqat bir marta salomlash uchun
// (remount/strict-mode tufayli ikki marta salomlashmaslik). F5 da tozalanadi.
const greetedTables = new Set<string>();

type Status = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceAssistantProps {
  tableCode: string;
  cart: Record<string, number>;
  onAdd: (productId: string, qty: number) => void;
  onRemove: (productId: string, qty: number) => void;
  onPlace: () => void;
}

export default function VoiceAssistant({
  tableCode,
  cart,
  onAdd,
  onRemove,
  onPlace,
}: VoiceAssistantProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [interim, setInterim] = useState('');
  // Autoplay bloklansa, salomlashuvni birinchi bosishда o'ynatamiz
  const [pendingGreeting, setPendingGreeting] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const cartRef = useRef(cart);
  const messagesRef = useRef<AiChatMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bir xil matn 3s ichida ikki marta o'qilib ketmasligi uchun (dublikatga qarshi)
  const lastSpeakRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  // Circular bog'lanishni uzish uchun startListening'ga ref orqali murojaat
  const startListeningRef = useRef<(() => void) | null>(null);
  const supported = typeof window !== 'undefined' && !!getRecognitionCtor();

  const hasCart = Object.values(cart).some((q) => q > 0);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const cartSnapshot = useCallback((): AiCartItem[] => {
    return Object.entries(cartRef.current)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
  }, []);

  const clearSilence = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  // AI gapirib bo'lgach mikrofonni avtomatik yoqamiz (mijoz javob bersin)
  const autoListen = useCallback(() => {
    setStatus('idle');
    startListeningRef.current?.();
  }, []);

  // Gapirib bo'lgandan keyingi ish: tinglash yoki to'xtash
  const finishSpeaking = useCallback(
    (listenAfter: boolean) => {
      if (listenAfter) autoListen();
      else setStatus('idle'); // buyurtma berilgach ovoz o'chadi
    },
    [autoListen],
  );

  // Zaxira: brauzer ovozi (Aisha ishlamasa)
  const speakBrowser = useCallback(
    (text: string, listenAfter: boolean) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        finishSpeaking(listenAfter);
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find((v) => v.lang.toLowerCase().startsWith('uz')) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('tr'));
      if (pick) u.voice = pick;
      u.lang = pick?.lang ?? 'uz-UZ';
      u.onstart = () => setStatus('speaking');
      u.onend = () => finishSpeaking(listenAfter);
      window.speechSynthesis.speak(u);
    },
    [finishSpeaking],
  );

  // Matnni ovozda o'qish — avval Aisha (sof o'zbek), bo'lmasa brauzer.
  // listenAfter=true bo'lsa tugagach mikrofon avtomatik yoqiladi.
  const speak = useCallback(
    async (raw: string, listenAfter = true) => {
      const text = cleanForSpeech(raw);
      if (!text) {
        finishSpeaking(listenAfter);
        return;
      }
      // Dublikatga qarshi: bir xil matn 3s ichida qayta o'qilmasin
      const now = Date.now();
      if (
        text === lastSpeakRef.current.text &&
        now - lastSpeakRef.current.at < 3000
      ) {
        return;
      }
      lastSpeakRef.current = { text, at: now };

      stopSpeaking();
      setStatus('speaking');

      let url: string | null = null;
      try {
        url = await synthesizeSpeech(text);
      } catch {
        url = null;
      }
      if (!url) {
        speakBrowser(text, listenAfter);
        return;
      }

      const audio = new Audio(url);
      const finalUrl = url;
      audio.onended = () => {
        URL.revokeObjectURL(finalUrl);
        if (audioRef.current === audio) audioRef.current = null;
        finishSpeaking(listenAfter);
      };
      audioRef.current = audio;
      try {
        await audio.play();
      } catch {
        // Brauzer avto-ovozni bloklaganda: birinchi bosishда o'ynatamiz
        audioRef.current = null;
        pendingAudioRef.current = audio;
        setPendingGreeting(true);
        setStatus('idle');
      }
    },
    [stopSpeaking, speakBrowser, finishSpeaking],
  );

  // AI ga xabar yuborish va javobni qayta ishlash
  const send = useCallback(
    async (userText: string | null) => {
      setStatus('thinking');
      stopSpeaking();

      if (userText) {
        messagesRef.current = [
          ...messagesRef.current,
          { role: 'user', text: userText },
        ];
      }

      try {
        const res = await sendAiMessage(
          tableCode,
          messagesRef.current,
          cartSnapshot(),
        );

        let place = false;
        for (const a of res.actions) {
          if (a.type === 'add')
            a.items.forEach((i) => onAdd(i.productId, i.quantity));
          else if (a.type === 'remove')
            a.items.forEach((i) => onRemove(i.productId, i.quantity));
          else if (a.type === 'place') place = true;
        }
        if (place) onPlace();

        if (res.reply) {
          messagesRef.current = [
            ...messagesRef.current,
            { role: 'assistant', text: res.reply },
          ];
          // Buyurtma berilgach gapirib bo'lib ovoz o'chadi (avto-tinglamaydi)
          speak(res.reply, !place);
        } else if (place) {
          setStatus('idle');
        } else {
          autoListen();
        }
      } catch {
        setStatus('idle');
      }
    },
    [tableCode, cartSnapshot, onAdd, onRemove, onPlace, speak, stopSpeaking, autoListen],
  );

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (recognitionRef.current) return; // allaqachon tinglayapti
    stopSpeaking();

    const rec = new Ctor();
    rec.lang = 'uz-UZ';
    rec.continuous = true;
    rec.interimResults = true;
    transcriptRef.current = '';
    setInterim('');

    const armSilence = () => {
      clearSilence();
      silenceTimerRef.current = setTimeout(() => {
        rec.stop();
      }, SILENCE_MS);
    };

    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) transcriptRef.current += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      armSilence(); // har gap eshitilganда 4s qaytadan sanaladi
    };
    rec.onend = () => {
      clearSilence();
      recognitionRef.current = null;
      setInterim('');
      const text = transcriptRef.current.trim();
      if (text) send(text);
      else setStatus('idle');
    };
    rec.onerror = () => {
      clearSilence();
      recognitionRef.current = null;
      setInterim('');
      setStatus('idle');
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setStatus('listening');
      armSilence();
    } catch {
      recognitionRef.current = null;
      setStatus('idle');
    }
  }, [send, stopSpeaking, clearSilence]);

  // speak/auto-listen ichidan chaqirish uchun refni yangilab turamiz
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Tugma bosilganda — holatga qarab ish
  const handleTap = () => {
    // Avto-ovoz bloklangan salomlashuv bo'lsa — avval uni o'ynatamiz
    if (pendingAudioRef.current) {
      const audio = pendingAudioRef.current;
      pendingAudioRef.current = null;
      setPendingGreeting(false);
      audioRef.current = audio;
      setStatus('speaking');
      audio.play().catch(() => autoListen());
      return;
    }
    if (status === 'thinking') return;
    if (status === 'listening') {
      recognitionRef.current?.stop();
      return;
    }
    if (status === 'speaking') {
      stopSpeaking();
      startListening();
      return;
    }
    startListening();
  };

  // Sahifa ochilganда AI bir marta o'zi salomlashadi (mikrofon o'chiq)
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    if (!greetedTables.has(tableCode)) {
      greetedTables.add(tableCode);
      send(null);
    }
    return () => {
      clearSilence();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = pendingGreeting
    ? '🔊 Boshlash uchun bosing'
    : status === 'listening'
      ? interim || 'Tinglayapman…'
      : status === 'thinking'
        ? 'O‘ylayapman…'
        : status === 'speaking'
          ? 'Gapiryapman…'
          : 'Gapirish uchun bosing';

  return (
    <div
      className={`fixed right-4 z-40 flex flex-col items-end gap-2 ${
        hasCart ? 'bottom-44' : 'bottom-6'
      }`}
    >
      <span className="max-w-[70vw] truncate rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow-card">
        {label}
      </span>

      <button
        onClick={handleTap}
        disabled={!supported && status === 'idle' && !pendingGreeting}
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-card-hover transition-all disabled:opacity-50 ${
          status === 'listening'
            ? 'animate-pulse bg-rose-500'
            : status === 'speaking'
              ? 'bg-brand-500'
              : pendingGreeting
                ? 'animate-pulse bg-brand-600'
                : 'bg-brand-600 hover:scale-105 active:scale-95'
        }`}
        aria-label="AI ofitsiant mikrofoni"
      >
        {status === 'thinking' ? (
          <Loader2 size={26} className="animate-spin" />
        ) : status === 'listening' ? (
          <Square size={24} fill="white" />
        ) : status === 'speaking' ? (
          <Volume2 size={26} />
        ) : (
          <Mic size={26} />
        )}
      </button>

      {!supported && (
        <span className="max-w-[70vw] rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-500 shadow-card">
          Mikrofon uchun Chrome’dan foydalaning
        </span>
      )}
    </div>
  );
}
