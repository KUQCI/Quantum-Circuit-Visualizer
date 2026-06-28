import type { Monaco } from "@monaco-editor/react";
import type { languages, Position, editor } from "monaco-editor";
import { GATE_LIBRARY_UI } from "@/components/gates/gate-definitions";
import type { CodeLanguageId } from "@/lib/code-adapters";

let setupDone = false;

const QISKIT_SNIPPETS = [
  {
    label: "QuantumCircuit import",
    insertText: "from qiskit import QuantumCircuit",
    detail: "Import QuantumCircuit",
  },
  {
    label: "QuantumCircuit(2)",
    insertText: "qc = QuantumCircuit(${1:2}, ${2:0})",
    detail: "Create a 2-qubit circuit",
  },
  {
    label: "QuantumCircuit(2, 2)",
    insertText: "qc = QuantumCircuit(${1:2}, ${2:2})",
    detail: "Create circuit with classical register",
  },
];

const OPENQASM_SNIPPETS = [
  { label: "OPENQASM 2.0", insertText: 'OPENQASM 2.0;\ninclude "qelib1.inc";' },
  { label: "qreg", insertText: "qreg q[${1:2}];" },
  { label: "creg", insertText: "creg c[${1:2}];" },
];

function gateInsertText(example: string): string {
  const match = example.match(/^qc\.(\w+)\((.*)\)$/);
  if (!match) return example.replace(/^qc\./, "");

  const [, gate, args] = match;
  if (!args) return `${gate}()`;

  const parts = args.split(",").map((part) => part.trim());
  const placeholders = parts.map((part, index) => `\${${index + 1}:${part}}`);
  return `${gate}(${placeholders.join(", ")})`;
}

function completionRange(model: editor.ITextModel, position: Position) {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: position.column,
  };
}

/** After `qc.` the word range is empty — insert only the gate suffix at the cursor */
function qiskitDotCompletionRange(
  model: editor.ITextModel,
  position: Position,
  linePrefix: string
) {
  if (/(?:qc|circuit)\.$/.test(linePrefix)) {
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column,
      endColumn: position.column,
    };
  }
  return completionRange(model, position);
}

function registerQiskitCompletions(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", "(", " "],
    provideCompletionItems(
      model: editor.ITextModel,
      position: Position
    ): languages.ProviderResult<languages.CompletionList> {
      const linePrefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const range = qiskitDotCompletionRange(model, position, linePrefix);
      const suggestions: languages.CompletionItem[] = [];

      if (/(?:qc|circuit)\.$/.test(linePrefix)) {
        for (const gate of GATE_LIBRARY_UI) {
          if (gate.type === "control") continue;
          suggestions.push({
            label: gate.type,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: gateInsertText(gate.qiskitExample),
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: gate.fullName,
            documentation: gate.description,
            filterText: gate.type,
            sortText: `0_${gate.type}`,
            range,
          });
        }
      } else if (
        /^\s*(?:from qiskit|import|qc\s*=)/.test(linePrefix) ||
        (linePrefix.trim().length <= 3 && !/(?:qc|circuit)\./.test(linePrefix))
      ) {
        for (const snippet of QISKIT_SNIPPETS) {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: snippet.detail,
            range,
          });
        }
      }

      return { suggestions };
    },
  });
}

function registerOpenQasmCompletions(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider("plaintext", {
    triggerCharacters: [" ", "[", ";"],
    provideCompletionItems(
      model: editor.ITextModel,
      position: Position
    ): languages.ProviderResult<languages.CompletionList> {
      const linePrefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const range = completionRange(model, position);
      const suggestions: languages.CompletionItem[] = [];

      if (linePrefix.trim().length <= 8) {
        for (const snippet of OPENQASM_SNIPPETS) {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        }
      }

      for (const gate of GATE_LIBRARY_UI) {
        if (gate.type === "control" || gate.type === "barrier") continue;

        let insertText = `${gate.type} q[\${1:0}];`;
        if (gate.type === "measure") {
          insertText = "measure q[${1:0}] -> c[${2:0}];";
        } else if (gate.type === "reset") {
          insertText = "reset q[${1:0}];";
        } else if (["cx", "cz", "swap"].includes(gate.type)) {
          insertText = `${gate.type} q[\${1:0}], q[\${2:1}];`;
        } else if (["rx", "ry", "rz", "p"].includes(gate.type)) {
          insertText = `${gate.type}(\${1:pi/2}) q[\${2:0}];`;
        }

        suggestions.push({
          label: gate.type,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: gate.fullName,
          documentation: gate.description,
          range,
        });
      }

      return { suggestions };
    },
  });
}

export function setupMonacoEditor(monaco: Monaco) {
  if (setupDone) return;
  setupDone = true;

  registerQiskitCompletions(monaco);
  registerOpenQasmCompletions(monaco);
}

export function getMonacoEditorOptions(readOnly: boolean) {
  return {
    readOnly,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
    tabSize: 4,
    renderLineHighlight: readOnly ? ("none" as const) : ("line" as const),
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    fixedOverflowWidgets: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: "off" as const,
    acceptSuggestionOnEnter: "on" as const,
    tabCompletion: "onlySnippets" as const,
    suggest: {
      showMethods: true,
      showFunctions: true,
      showKeywords: true,
      showSnippets: true,
      preview: true,
      showIcons: true,
    },
  };
}

export function monacoLanguageForProfile(
  monacoLanguage: string,
  profile?: CodeLanguageId
): string {
  if (profile === "openqasm") return "plaintext";
  return monacoLanguage;
}
