"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Animation style when entering the viewport */
  variant?: RevealVariant;
  /** Stagger delay in ms */
  delay?: number;
  /** Only animate once (default true) */
  once?: boolean;
  /** Semantic wrapper — maps to a div with role when needed */
  as?: "div" | "section" | "article";
}

/**
 * Lightweight scroll/mount reveal. Uses CSS classes from globals.css
 * and respects prefers-reduced-motion (class stays "in" immediately).
 */
export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  once = true,
  as = "div",
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const motionStyle: CSSProperties = {
    ...(delay ? ({ "--motion-delay": `${delay}ms` } as CSSProperties) : null),
    ...style,
  };

  const classNames = cn(
    "motion-reveal",
    `motion-reveal--${variant}`,
    visible && "motion-reveal--in",
    className
  );

  if (as === "section") {
    return (
      <section ref={ref} className={classNames} style={motionStyle} {...rest}>
        {children}
      </section>
    );
  }

  if (as === "article") {
    return (
      <article ref={ref} className={classNames} style={motionStyle} {...rest}>
        {children}
      </article>
    );
  }

  return (
    <div ref={ref} className={classNames} style={motionStyle} {...rest}>
      {children}
    </div>
  );
}
