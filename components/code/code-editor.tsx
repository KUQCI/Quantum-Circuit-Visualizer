"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useThemeStore, getMonacoTheme } from "@/store/theme-store";
import type { CodeLanguageId } from "@/lib/code-adapters";
import {
  getMonacoEditorOptions,
  monacoLanguageForProfile,
  setupMonacoEditor,
} from "@/lib/monaco-editor-setup";
import type { Monaco, OnMount } from "@monaco-editor/react";

export interface CodeDiagnostic {
  line: number;
  message: string;
  severity: "error" | "warning";
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
      Loading editor…
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
  diagnostics?: CodeDiagnostic[];
  active?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  language = "python",
  completionProfile,
  diagnostics = [],
  active = true,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const editorLanguage = monacoLanguageForProfile(language, completionProfile);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBeforeMount = (monaco: Monaco) => {
    setupMonacoEditor(monaco);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!model || !monaco) return;

    monaco.editor.setModelMarkers(
      model,
      "qci",
      diagnostics.flatMap((diagnostic) => {
        if (
          diagnostic.line < 1 ||
          diagnostic.line > model.getLineCount()
        ) {
          return [];
        }
        return [
          {
            startLineNumber: diagnostic.line,
            endLineNumber: diagnostic.line,
            startColumn: 1,
            endColumn: model.getLineMaxColumn(diagnostic.line),
            message: diagnostic.message,
            severity:
              diagnostic.severity === "error"
                ? monaco.MarkerSeverity.Error
                : monaco.MarkerSeverity.Warning,
          },
        ];
      })
    );
  }, [diagnostics, editorReady]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !active) return;
    const frame = window.requestAnimationFrame(() => editor.layout());
    return () => window.cancelAnimationFrame(frame);
  }, [active, editorReady]);

  useEffect(() => {
    const container = containerRef.current;
    const editor = editorRef.current;
    if (!container || !editor || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => editor.layout());
    observer.observe(container);
    return () => observer.disconnect();
  }, [editorReady]);

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] text-sm text-[var(--color-muted-foreground)]"
        style={{ height }}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="code-editor-root h-full min-h-0 rounded-lg border border-[var(--color-border)]"
    >
      <MonacoEditor
        height={height}
        language={editorLanguage}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        theme={getMonacoTheme(theme)}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={getMonacoEditorOptions(readOnly)}
      />
    </div>
  );
}
