"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadTextFile } from "@/lib/utils";
import { Copy, Download, Check } from "lucide-react";

interface CodePanelActionsProps {
  code: string;
  filename?: string;
  onExport?: () => void;
}

export function CodePanelActions({
  code,
  filename = "circuit.py",
  onExport,
}: CodePanelActionsProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(code);
      onExport?.();
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2500);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : copyError ? "Copy failed" : "Copy"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          downloadTextFile(code, filename);
          onExport?.();
        }}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
    </>
  );
}

export { CodePanelActions as CodePanel };
