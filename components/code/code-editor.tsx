"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useThemeStore, getMonacoTheme } from "@/store/theme-store";
import type { CodeLanguageId } from "@/lib/code-adapters";
import {
  getMonacoEditorOptions,
  monacoLanguageForProfile,
  setupMonacoEditor,
} from "@/lib/monaco-editor-setup";
import type { Monaco } from "@monaco-editor/react";

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
  completionProfile?: CodeLanguageId;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  language = "python",
  completionProfile,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const editorLanguage = monacoLanguageForProfile(language, completionProfile);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBeforeMount = (monaco: Monaco) => {
    setupMonacoEditor(monaco);
  };

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] text-sm text-[var(--color-muted-foreground)]"
        style={{ height }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className="code-editor-root h-full rounded-lg border border-[var(--color-border)]">
      <MonacoEditor
        height={height}
        language={editorLanguage}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        theme={getMonacoTheme(theme)}
        beforeMount={handleBeforeMount}
        options={getMonacoEditorOptions(readOnly)}
      />
    </div>
  );
}
