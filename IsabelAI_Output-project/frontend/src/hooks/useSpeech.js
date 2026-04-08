import { useState, useRef, useCallback, useEffect } from 'react';

// ── Speech-to-Text ─────────────────────────────────────────────────────────────
export function useSpeechToText({ onResult, onError }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim || final);
      if (final) onResult?.(final.trim());
    };

    recognition.onerror = (e) => {
      setListening(false);
      onError?.(e.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onResult, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { listening, transcript, start, stop, isSupported };
}

// ── Text-to-Speech ─────────────────────────────────────────────────────────────
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text, { rate = 1, pitch = 1, voice = null } = {}) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();

      // Strip markdown for cleaner speech
      const clean = text
        .replace(/```[\s\S]*?```/g, ' code block ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/[-*+]\s/g, '')
        .replace(/\n+/g, '. ');

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const getVoices = useCallback(() => {
    if (!isSupported) return [];
    return window.speechSynthesis.getVoices();
  }, [isSupported]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { speaking, speak, stop, getVoices, isSupported };
}
