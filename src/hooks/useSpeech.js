import { useCallback, useEffect, useRef, useState } from 'react';

// SpeechSynthesis helper & voice controller.
// - Sentences are read with an en-US voice at rate 0.88, pitch 1.0
// - The isolated target word can be replayed slowly at rate 0.75
// - The user's wrong spelling is read back so they can hear the difference

const SENTENCE_RATE = 0.88;
const SLOW_RATE = 0.75;

export default function useSpeech() {
  const [muted, setMuted] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' && Boolean(window.speechSynthesis)
  );
  const voiceRef = useRef(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const pickVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find((v) => v.lang === 'en-US' && /google/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0]
    );
  }, []);

  // Warm up the voices list (Chrome loads it asynchronously)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    const load = () => {
      voiceRef.current = pickVoice();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [pickVoice]);

  const speak = useCallback(
    (text, { rate = SENTENCE_RATE, pitch = 1.0 } = {}) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (mutedRef.current) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = voiceRef.current || pickVoice();
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || 'en-US';
      utter.rate = rate;
      utter.pitch = pitch;
      window.speechSynthesis.speak(utter);
    },
    [pickVoice]
  );

  const speakSentence = useCallback(
    (sentence) => speak(sentence, { rate: SENTENCE_RATE, pitch: 1.0 }),
    [speak]
  );

  const speakWordSlow = useCallback(
    (word) => speak(word, { rate: SLOW_RATE, pitch: 1.0 }),
    [speak]
  );

  // Spell out the target word letter by letter slowly
  const speakLetters = useCallback(
    (word) => {
      if (!word) return;
      speak(word.toLowerCase().split('').join('. '), { rate: 0.7, pitch: 1.0 });
    },
    [speak]
  );

  // Pronounce the exact (wrong) spelling the user typed
  const speakTypo = useCallback(
    (attempt) => {
      if (!attempt) return;
      speak(attempt, { rate: SLOW_RATE, pitch: 1.0 });
    },
    [speak]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return !m;
    });
  }, []);

  return {
    supported,
    muted,
    toggleMute,
    speak,
    speakSentence,
    speakWordSlow,
    speakLetters,
    speakTypo,
    stop,
  };
}
