import { useLayoutEffect, useState, type RefObject } from "react";

interface PopupAnchor {
  x: number;
  y: number;
}

interface PopupPosition {
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
}

export function useClampedPopupPosition(
  popupRef: RefObject<HTMLElement | null>,
  anchor: PopupAnchor
) {
  const [position, setPosition] = useState<PopupPosition | null>(null);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    const { width, height } = popup.getBoundingClientRect();
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const x = Math.min(Math.max(8, anchor.x + 8), maxX);
    const aboveY = anchor.y - height - 8;
    const preferredY = aboveY < 0 ? anchor.y + 8 : aboveY;
    const maxY = Math.max(8, window.innerHeight - height - 8);
    const y = Math.min(Math.max(8, preferredY), maxY);

    setPosition({
      anchorX: anchor.x,
      anchorY: anchor.y,
      x,
      y,
    });
  }, [anchor.x, anchor.y, popupRef]);

  const isMeasured =
    position?.anchorX === anchor.x && position.anchorY === anchor.y;

  return { position, isMeasured };
}
