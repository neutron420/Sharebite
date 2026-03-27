"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslationStore } from '@/lib/translation-store';

interface TranslateProps {
  children: string;
}

export const Translate = ({ children }: TranslateProps) => {
  const { currentLanguage } = useTranslationStore();
  const [translatedText, setTranslatedText] = useState(children);
  const [isTranslating, setIsTranslating] = useState(false);

  // Simple in-memory cache for the session
  const cacheKey = useMemo(() => `trans_${currentLanguage}_${children}`, [currentLanguage, children]);

  useEffect(() => {
    const translate = async () => {
      if (currentLanguage === 'en') {
        setTranslatedText(children);
        return;
      }

      // Check localStorage cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslatedText(cached);
        return;
      }

      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          body: JSON.stringify({ text: children, to: currentLanguage }),
        });
        const data = await response.json();
        
        // Handle various RapidAPI response formats (text, trans, translatedText)
        // Handle various RapidAPI response formats (text, trans, translatedText, data...)
        const text = data?.text || 
                    data?.trans || 
                    data?.translatedText || 
                    data?.translated_text || 
                    data?.data ||
                    data?.translations?.[0]?.translatedText ||
                    children;
        
        setTranslatedText(text);
        if (text !== children) {
          localStorage.setItem(cacheKey, text);
        }
      } catch (err) {
        console.error('Translation failed', err);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [currentLanguage, children, cacheKey]);

  return (
    <span className={isTranslating ? "animate-pulse opacity-70" : ""}>
      {translatedText}
    </span>
  );
};
