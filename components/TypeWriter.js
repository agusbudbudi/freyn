"use client";

import { useState, useEffect, useCallback } from "react";

const words = ["proyek freelance", "Invoice", "Portfolio"];

export default function TypeWriter() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      // Typing forward
      const next = currentWord.slice(0, text.length + 1);
      setText(next);

      if (next === currentWord) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 1800);
        return;
      }
    } else {
      // Deleting
      const next = currentWord.slice(0, text.length - 1);
      setText(next);

      if (next === "") {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
        return;
      }
    }
  }, [text, isDeleting, wordIndex]);

  useEffect(() => {
    const speed = isDeleting ? 50 : 100;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting]);

  return (
    <span className="blue-pill-tag typewriter-pill">
      {text}
      <span className="typewriter-cursor">|</span>
    </span>
  );
}
