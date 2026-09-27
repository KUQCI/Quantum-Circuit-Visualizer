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
  eager?: boolean;
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
  eager = false,
}: CodeEditorProps) {
  const [lightweight, setLightweight] = useState(true);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusOnMountRef = useRef(false);
  const theme = useThemeStore((s) => s.theme);
  const editorLanguage = monacoLanguageForProfile(language, completionProfile);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const prefetch = () => {
      void import("@monaco-editor/react");
    };
    const idleId = idleWindow.requestIdleCallback?.(prefetch, { timeout: 4000 });
    const timeoutId =
      idleId === undefined ? window.setTimeout(prefetch, 2000) : undefined;

    return () => {
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (eager || (diagnostics.length > 0 && !readOnly)) {
      setLightweight(false);
    }
  }, [diagnostics.length, eager, readOnly]);

  const handleBeforeMount = (monaco: Monaco) => {
    setupMonacoEditor(monaco);
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
    if (focusOnMountRef.current) {
      focusOnMountRef.current = false;
      window.requestAnimationFrame(() => editor.focus());
    }
  };

  const upgradeToMonaco = () => {
    focusOnMountRef.current = true;
    setLightweight(false);
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

  return (
    <div
      ref={containerRef}
      className="code-editor-root h-full min-h-0 rounded-lg border border-[var(--color-border)]"
      style={{ height }}
    >
      {lightweight ? (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)]">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div
              aria-hidden="true"
              className="select-none border-r border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-3 text-right font-mono text-xs leading-5 text-[var(--color-muted-foreground)]"
            >
              {value.split("\n").map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            <pre
              tabIndex={0}
              role="textbox"
              aria-readonly={readOnly}
              aria-label="Code (click to edit)"
              onPointerDown={upgradeToMonaco}
              onFocus={upgradeToMonaco}
              onKeyDown={upgradeToMonaco}
              className="min-w-0 flex-1 overflow-auto whitespace-pre px-3 py-3 font-mono text-xs leading-5 outline-none focus:ring-2 focus:ring-[var(--color-brand)]/50"
            >
              {value || " "}
            </pre>
          </div>
          {diagnostics.length > 0 && (
            <p className="shrink-0 border-t border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted-foreground)]">
              {diagnostics.length} issue{diagnostics.length === 1 ? "" : "s"} —
              click to edit
            </p>
          )}
        </div>
      ) : (
        <MonacoEditor
          height="100%"
          language={editorLanguage}
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          theme={getMonacoTheme(theme)}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={getMonacoEditorOptions(readOnly)}
        />
      )}
    </div>
  );
}
