"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadTextFile } from "@/lib/utils";
import { Copy, Download, Check } from "lucide-react";

interface CodePanelActionsProps {
  code: string;
  filename?: string;
}

export function CodePanelActions({
  code,
  filename = "circuit.py",
}: CodePanelActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTextFile(code, filename)}
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
    </>
  );
}

export { CodePanelActions as CodePanel };
