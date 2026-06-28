"use client";

import { useEffect, useState } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/** Track an element's content box with ResizeObserver. */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, size, isMeasured: size.height > 0 && size.width > 0 };
}
