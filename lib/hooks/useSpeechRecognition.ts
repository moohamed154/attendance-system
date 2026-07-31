'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API Type Definitions
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
}

function getSpeechRecognitionAPI(): (new () => ISpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    language = 'ar-EG',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [isSupported] = useState<boolean>(() => !!getSpeechRecognitionAPI());
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe catch
      }
      setIsListening(false);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stop]);

  const start = useCallback(async () => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    const currentLang = optionsRef.current.language || language || 'ar-EG';
    const isAr = currentLang.startsWith('ar');

    if (!SpeechRecognitionAPI) {
      const errMsg = isAr
        ? 'متصفحك لا يدعم التعرف على الصوت.'
        : 'Speech recognition is not supported in this browser.';
      setError(errMsg);
      optionsRef.current.onError?.(errMsg);
      return;
    }

    // Pre-flight microphone permission check to trigger browser permission dialog if needed
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setIsListening(false);
        const userFriendlyError = isAr
          ? 'تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.'
          : 'Microphone permission was denied. Please allow microphone access in browser settings.';
        setError(userFriendlyError);
        optionsRef.current.onError?.(userFriendlyError);
        return;
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Safe catch
      }
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.lang = optionsRef.current.language || language || 'ar-EG';
      recognition.continuous = optionsRef.current.continuous ?? continuous;
      recognition.interimResults = optionsRef.current.interimResults ?? interimResults;
      recognition.maxAlternatives = optionsRef.current.maxAlternatives ?? maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setInterimTranscript('');
        optionsRef.current.onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          const trimmedFinal = currentFinal.trim();
          setTranscript((prev) => {
            const nextVal = prev ? `${prev} ${trimmedFinal}` : trimmedFinal;
            optionsRef.current.onResult?.(nextVal, true);
            return nextVal;
          });
          setInterimTranscript('');
        } else if (currentInterim) {
          setInterimTranscript(currentInterim);
          optionsRef.current.onResult?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        const activeLang = optionsRef.current.language || language || 'ar-EG';
        const isArLang = activeLang.startsWith('ar');

        let userFriendlyError = isArLang
          ? 'حدث خطأ أثناء التعرف على الصوت.'
          : 'An error occurred during speech recognition.';

        switch (event.error) {
          case 'no-speech':
            userFriendlyError = isArLang
              ? 'لم يتم رصد أي صوت. يرجى المحاولة مرة أخرى.'
              : 'No speech was detected. Please try speaking again.';
            break;
          case 'audio-capture':
            userFriendlyError = isArLang
              ? 'لم يتم العثور على ميكروفون أو الميكروفون غير متاح.'
              : 'No microphone was found or microphone is unavailable.';
            break;
          case 'not-allowed':
          case 'permission-denied':
            userFriendlyError = isArLang
              ? 'تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.'
              : 'Microphone permission was denied. Please allow microphone access in browser settings.';
            break;
          case 'network':
            userFriendlyError = isArLang
              ? 'حدث خطأ في الاتصال بالشبكة أثناء التعرف على الصوت.'
              : 'Network error occurred during speech recognition.';
            break;
          case 'aborted':
            userFriendlyError = isArLang
              ? 'تم إلغاء التعرف على الصوت.'
              : 'Speech recognition was cancelled.';
            break;
          default:
            userFriendlyError = isArLang
              ? `خطأ في التعرف على الصوت: ${event.error}`
              : `Speech error: ${event.error}`;
        }

        setError(userFriendlyError);
        optionsRef.current.onError?.(userFriendlyError);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        optionsRef.current.onEnd?.();
      };

      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      const activeLang = optionsRef.current.language || language || 'ar-EG';
      const isArLang = activeLang.startsWith('ar');
      const errMsg = err instanceof Error ? err.message : (isArLang ? 'فشل بدء التعرف على الصوت.' : 'Failed to start speech recognition.');
      setError(errMsg);
      optionsRef.current.onError?.(errMsg);
    }
  }, [language, continuous, interimResults, maxAlternatives]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe catch
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
