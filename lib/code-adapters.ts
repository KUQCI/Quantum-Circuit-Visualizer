import type { Circuit } from "./circuit-schema";
import { generateQiskitCode } from "./qiskit-generator";
import { generateOpenQasm } from "./openqasm-generator";
import { generateCirqCode } from "./cirq-generator";
import { parseQiskitCode } from "./qiskit-parser";
import { parseOpenQasm } from "./openqasm-parser";

export type CodeLanguageId =
  | "qiskit"
  | "openqasm"
  | "cirq"
  | "qiskit-runtime"
  | "json";

export interface CodeParseResult {
  success: boolean;
  circuit?: Circuit;
  error?: string;
}

export interface CodeGenerateResult {
  success: boolean;
  code?: string;
  error?: string;
}

export interface CodeLanguageAdapter {
  id: CodeLanguageId;
  label: string;
  description: string;
  monacoLanguage: string;
  defaultFilename: string;
  bidirectional: boolean;
  docsUrl?: string;
  parse: (code: string, circuitName?: string) => CodeParseResult;
  generate: (circuit: Circuit) => CodeGenerateResult;
}

function wrapParse(
  fn: (code: string, name?: string) => { success: boolean; circuit?: Circuit; error?: string }
): (code: string, circuitName?: string) => CodeParseResult {
  return (code, circuitName) => fn(code, circuitName);
}

function wrapGenerate(
  fn: (circuit: Circuit) => { success: boolean; code?: string; error?: string }
): (circuit: Circuit) => CodeGenerateResult {
  return (circuit) => {
    const result = fn(circuit);
    if (result.success) return { success: true, code: result.code };
    return { success: false, error: result.error };
  };
}

function generateQiskitRuntimeSnippet(circuit: Circuit): CodeGenerateResult {
  const qiskit = generateQiskitCode(circuit);
  if (!qiskit.success) return { success: false, error: qiskit.error };

  const code = `"""
IBM Quantum Runtime — Sampler V2 example
Docs: https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime
"""
from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler

# --- circuit (from visual editor) ---
${qiskit.code.replace(/^from qiskit import QuantumCircuit\n\n/, "")}
# --- end circuit ---

service = QiskitRuntimeService()  # requires IBM Quantum account
backend = service.least_busy(operational=True, simulator=False)
sampler = Sampler(backend)
job = sampler.run([qc], shots=1024)
result = job.result()
print(result[0].data.meas.get_counts())
`;
  return { success: true, code };
}

function generateJsonIr(circuit: Circuit): CodeGenerateResult {
  return {
    success: true,
    code: JSON.stringify(circuit, null, 2) + "\n",
  };
}

function parseJsonIr(code: string, circuitName?: string): CodeParseResult {
  try {
    const parsed = JSON.parse(code);
    if (!parsed.qubits || !parsed.operations) {
      return { success: false, error: "Invalid circuit JSON: missing qubits or operations" };
    }
    return {
      success: true,
      circuit: {
        ...parsed,
        name: circuitName ?? parsed.name ?? "Imported Circuit",
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid JSON",
    };
  }
}

export const CODE_LANGUAGES: CodeLanguageAdapter[] = [
  {
    id: "qiskit",
    label: "Qiskit",
    description: "Qiskit Python SDK — build and run quantum circuits",
    monacoLanguage: "python",
    defaultFilename: "circuit.py",
    bidirectional: true,
    docsUrl: "https://quantum.cloud.ibm.com/docs/en/api/qiskit",
    parse: wrapParse(parseQiskitCode),
    generate: wrapGenerate(generateQiskitCode),
  },
  {
    id: "openqasm",
    label: "OpenQASM 2.0",
    description: "Open Quantum Assembly Language — IBM Composer native format",
    monacoLanguage: "plaintext",
    defaultFilename: "circuit.qasm",
    bidirectional: true,
    docsUrl: "https://quantum.cloud.ibm.com/docs/en/guides/composer",
    parse: wrapParse(parseOpenQasm),
    generate: wrapGenerate(generateOpenQasm),
  },
  {
    id: "cirq",
    label: "Cirq",
    description: "Google Cirq Python — export only",
    monacoLanguage: "python",
    defaultFilename: "circuit_cirq.py",
    bidirectional: false,
    docsUrl: "https://quantumai.google/cirq",
    parse: () => ({
      success: false,
      error: "Cirq import is not supported. Switch to Qiskit or OpenQASM to edit visually.",
    }),
    generate: wrapGenerate(generateCirqCode),
  },
  {
    id: "qiskit-runtime",
    label: "Runtime",
    description: "Qiskit IBM Runtime — run on IBM Quantum hardware",
    monacoLanguage: "python",
    defaultFilename: "run_on_ibm.py",
    bidirectional: false,
    docsUrl: "https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime",
    parse: () => ({
      success: false,
      error: "Runtime snippets are export-only. Edit the circuit visually or in Qiskit/OpenQASM.",
    }),
    generate: generateQiskitRuntimeSnippet,
  },
  {
    id: "json",
    label: "JSON IR",
    description: "Internal circuit intermediate representation",
    monacoLanguage: "json",
    defaultFilename: "circuit.json",
    bidirectional: true,
    parse: parseJsonIr,
    generate: generateJsonIr,
  },
];

export function getCodeLanguage(id: CodeLanguageId): CodeLanguageAdapter {
  const adapter = CODE_LANGUAGES.find((l) => l.id === id);
  if (!adapter) throw new Error(`Unknown language: ${id}`);
  return adapter;
}

export const IBM_QUANTUM_API_LINKS = [
  {
    label: "Qiskit SDK",
    url: "https://quantum.cloud.ibm.com/docs/en/api/qiskit",
    description: "Core Python SDK for building quantum circuits",
  },
  {
    label: "Qiskit C",
    url: "https://quantum.cloud.ibm.com/docs/en/api/qiskit-c",
    description: "C API for high-performance quantum computing",
  },
  {
    label: "Qiskit IBM Runtime",
    url: "https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime",
    description: "Run circuits on IBM Quantum hardware and simulators",
  },
  {
    label: "Runtime REST API",
    url: "https://quantum.cloud.ibm.com/docs/en/api/qiskit-runtime-rest",
    description: "REST interface for Qiskit Runtime jobs",
  },
  {
    label: "Quantum System REST",
    url: "https://quantum.cloud.ibm.com/docs/en/api/quantum-system-rest",
    description: "Access quantum systems and backends via REST",
  },
  {
    label: "IBM Transpiler",
    url: "https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-transpiler",
    description: "Hardware-aware circuit transpilation",
  },
  {
    label: "Qiskit Addons",
    url: "https://quantum.cloud.ibm.com/docs/en/api/addons",
    description: "Extensions: dynamics, cut optimization, and more",
  },
] as const;
