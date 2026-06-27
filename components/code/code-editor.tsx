"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useThemeStore, getMonacoTheme } from "@/store/theme-store";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  language?: string;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  language = "python",
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] p-4 font-mono text-sm"
        style={{ height }}
      >
        {value}
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded border border-[var(--color-border)]">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        theme={getMonacoTheme(theme)}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
          tabSize: 4,
          renderLineHighlight: readOnly ? "none" : "line",
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
      />
    </div>
  );
}
