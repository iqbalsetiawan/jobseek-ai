'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface UseTypingAnimationOptions {
  text: string;
  /** Bump only when starting a new AI generation so edits do not restart the animation. */
  runKey: number | string;
  speed?: number;
  enabled?: boolean;
}

interface UseTypingAnimationResult {
  displayedText: string;
  isTyping: boolean;
}

export function useTypingAnimation({
  text,
  runKey,
  speed = 12,
  enabled = true,
}: UseTypingAnimationOptions): UseTypingAnimationResult {
  const prefersReducedMotion = usePrefersReducedMotion();
  const staticMode = !text || !enabled || prefersReducedMotion;
  const [animText, setAnimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  });

  useEffect(() => {
    if (staticMode) return;

    const targetText = textRef.current;
    const myGen = ++genRef.current;

    queueMicrotask(() => {
      if (myGen !== genRef.current) return;
      setAnimText('');
      indexRef.current = 0;
      setIsTyping(true);

      function typeNext() {
        if (myGen !== genRef.current) return;
        if (indexRef.current < targetText.length) {
          const charsToAdd = Math.floor(Math.random() * 2) + 1;
          const nextIndex = Math.min(
            indexRef.current + charsToAdd,
            targetText.length,
          );
          setAnimText(targetText.slice(0, nextIndex));
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
  }, [runKey, staticMode, speed, enabled]);

  if (staticMode) {
    return { displayedText: text, isTyping: false };
  }

  return { displayedText: animText, isTyping };
}
