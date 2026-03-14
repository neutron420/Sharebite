"use client";

import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface WordFadeInProps {
  words: string;
  className?: string;
  delay?: number;
}

export default function WordFadeIn({
  words,
  className,
  delay = 0.15,
}: WordFadeInProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * delay },
    }),
  };

  const wordArray = words.split(" ");

  return (
    <motion.h1
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn(
        "font-display text-center font-bold tracking-[-0.02em] drop-shadow-sm",
        className
      )}
    >
      {wordArray.map((word, i) => (
        <motion.span key={word + i} variants={variants} custom={i}>
          {word}{" "}
        </motion.span>
      ))}
    </motion.h1>
  );
}
