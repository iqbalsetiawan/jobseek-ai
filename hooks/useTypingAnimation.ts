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
  speed = 25,
  enabled = true,
}: UseTypingAnimationOptions): UseTypingAnimationResult {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text || !enabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    indexRef.current = 0;
    setIsTyping(true);

    function typeNext() {
      if (indexRef.current < text.length) {
        const charsToAdd = Math.floor(Math.random() * 2) + 1;
        const nextIndex = Math.min(indexRef.current + charsToAdd, text.length);
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;

        const jitter = Math.floor(Math.random() * 20);
        timeoutRef.current = setTimeout(typeNext, speed + jitter);
      } else {
        setIsTyping(false);
      }
    }

    timeoutRef.current = setTimeout(typeNext, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
