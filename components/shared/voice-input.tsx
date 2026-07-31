'use client';

import React from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  continuous?: boolean;
  autoCapitalize?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  type?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  'data-testid'?: string;
}

export function VoiceInput({
  value,
  onChange,
  language = 'ar-EG',
  placeholder,
  disabled = false,
  className,
  maxLength,
  name,
  id,
  required,
  type = 'text',
  continuous = false,
  onStart,
  onEnd,
  onError,
  'data-testid': dataTestId,
}: VoiceInputProps) {
  const isArabic = language.startsWith('ar');

  const {
    isSupported,
    isListening,
    interimTranscript,
    start,
    stop,
  } = useSpeechRecognition({
    language,
    continuous,
    interimResults: true,
    onStart,
    onEnd,
    onError: (err) => {
      toast.error(err);
      onError?.(err);
    },
    onResult: (text, isFinal) => {
      if (isFinal) {
        const newText = value ? `${value} ${text}`.trim() : text.trim();
        onChange(maxLength ? newText.slice(0, maxLength) : newText);
      }
    },
  });

  const handleToggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSupported) {
      toast.error(
        isArabic
          ? 'متصفحك لا يدعم التعرف على الصوت.'
          : 'Speech recognition is not supported in your browser.'
      );
      return;
    }

    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  const displayValue = isListening && interimTranscript
    ? (value ? `${value} ${interimTranscript}` : interimTranscript)
    : value;

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={
          isListening
            ? (isArabic ? 'جارٍ الاستماع...' : 'Listening...')
            : placeholder
        }
        maxLength={maxLength}
        className={cn(
          'w-full rtl:pl-10 ltr:pr-10 transition-all',
          isListening && 'border-red-500 ring-2 ring-red-500/20 bg-red-500/5'
        )}
        data-testid={dataTestId}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={handleToggleListening}
        aria-label={
          isListening
            ? isArabic
              ? 'إيقاف الاستماع الصوتي'
              : 'Stop voice listening'
            : isArabic
            ? 'بدء الإدخال الصوتي'
            : 'Start voice input'
        }
        className={cn(
          'absolute rtl:left-1 ltr:right-1 h-8 w-8 rounded-lg p-0 hover:bg-muted focus:ring-2 focus:ring-primary',
          isListening && 'text-red-500 hover:text-red-600'
        )}
      >
        {isListening ? (
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
        ) : (
          <Mic className={cn('h-4 w-4', !isSupported && 'opacity-40')} />
        )}
      </Button>

      {isListening && (
        <span className="sr-only" aria-live="polite">
          {isArabic ? 'جارٍ الاستماع الآن' : 'Listening now'}
        </span>
      )}
    </div>
  );
}
