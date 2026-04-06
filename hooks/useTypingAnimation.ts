'use client';

import { useState, useEffect, useRef } from 'react';

interface UseTypingAnimationOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
}

interface UseTypingAnimationResult {
  displayedText: string;
  isTyping: boolean;
}

export function useTypingAnimation({
  text,
  speed = 12,
  enabled = true,
}: UseTypingAnimationOptions): UseTypingAnimationResult {
  const staticMode = !text || !enabled;
  const [animText, setAnimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

  useEffect(() => {
    if (staticMode) return;

    const myGen = ++genRef.current;

    queueMicrotask(() => {
      if (myGen !== genRef.current) return;
      setAnimText('');
      indexRef.current = 0;
      setIsTyping(true);

      function typeNext() {
        if (myGen !== genRef.current) return;
        if (indexRef.current < text.length) {
          const charsToAdd = Math.floor(Math.random() * 2) + 1;
          const nextIndex = Math.min(
            indexRef.current + charsToAdd,
            text.length,
          );
          setAnimText(text.slice(0, nextIndex));
          indexRef.current = nextIndex;

          const jitter = Math.floor(Math.random() * 6);
          timeoutRef.current = setTimeout(typeNext, speed + jitter);
        } else {
          setIsTyping(false);
        }
      }

      timeoutRef.current = setTimeout(typeNext, speed);
    });

    return () => {
      genRef.current += 1;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [staticMode, text, speed, enabled]);

  if (staticMode) {
    return { displayedText: text, isTyping: false };
  }

  return { displayedText: animText, isTyping };
}
