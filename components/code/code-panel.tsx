"use client";

import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadTextFile } from "@/lib/utils";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";

interface CodePanelProps {
  code: string;
  filename?: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  height?: string;
}

export function CodePanelActions({
  code,
  filename = "circuit.py",
}: {
  code: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy Code"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTextFile(code, filename)}
      >
        <Download className="h-4 w-4" />
        Download .py
      </Button>
    </div>
  );
}

export { CodePanelActions as CodePanel };
