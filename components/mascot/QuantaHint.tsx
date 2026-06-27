"use client";

import { QuantaMessage } from "./QuantaMessage";

interface QuantaHintProps {
  hint: string;
  visible: boolean;
}

export function QuantaHint({ hint, visible }: QuantaHintProps) {
  if (!visible) return null;
  return (
    <QuantaMessage
      title="Quanta's hint"
      message={hint}
      variant="hint"
    />
  );
}
