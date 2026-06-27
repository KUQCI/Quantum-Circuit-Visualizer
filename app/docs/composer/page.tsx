import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    title: "What is Quantum Circuit Composer?",
    body: `The KUQCI Circuit Visualizer Composer is a graphical quantum programming workspace inspired by IBM Quantum Composer. Drag and drop operations to build quantum circuits, visualize qubit states live, and automatically generate multi-language code.`,
  },
  {
    title: "Tour of the interface",
    items: [
      "Operations catalog — building blocks grouped by color. Search, grid/list view, and hover for gate definitions.",
      "Code editor — right panel with live Qiskit code that syncs bidirectionally with the canvas.",
      "Graphical circuit editor — drag gates onto qubit wires. Select a gate for the action bar (info, copy, move, delete).",
      "Toolbar — undo/redo, alignment modes, inspect mode with step-through controls.",
      "Phase disks — optional visualization at each qubit wire end (single-qubit circuits). Toggle via View → Phase disks.",
      "Visualizations — Probabilities, Q-sphere, Statevector, and Measurement histogram panels at the bottom. Configure via View → Panels.",
    ],
  },
  {
    title: "Build your circuit",
    items: [
      "Drag gates from the Operations panel onto qubit wires.",
      "Right-click the canvas to paste a copied gate.",
      "Drag a placed gate to reposition it (or use the move handle on the action bar).",
      "Use Edit → Manage registers to set qubit and classical bit counts.",
      "Choose alignment: Freeform, Left alignment, or Layers alignment (View → Alignment).",
      "Name your circuit by editing the title in the top toolbar.",
      "Save via File → Save file (stored locally in your browser).",
    ],
  },
  {
    title: "Inspect mode",
    body: `Toggle Inspect in the canvas toolbar to step through circuit layers one at a time. Use the forward/back buttons to see how the quantum state evolves. While inspect mode is active, you cannot add new gates. Visualizations update to show the state after each layer.`,
  },
  {
    title: "Visualizations",
    items: [
      "Probabilities — bar chart of measurement outcome percentages (up to 8 qubits in IBM; we simulate up to 6).",
      "Q-sphere — global view of the quantum state on a sphere (ignores measurements during simulation).",
      "Statevector — table view with real/imaginary amplitudes, phase, and probability; toggle to bar chart.",
      "Measurement histogram — shot counts after running the circuit on the local simulator.",
      "Live visualizations (Probabilities, Q-sphere, Statevector) use a client-side statevector simulator and ignore measurement operations, matching IBM Composer behavior.",
    ],
  },
  {
    title: "Supported gates",
    body: `H, X, Y, Z, I, √X, √X†, S, S†, T, T†, P, RX, RY, RZ, U, CX, CZ, SWAP, RXX, RZZ, CCX, RCCX, RC3X, Measure, Reset, and Barrier. Hover any gate in the catalog for its Qiskit example and description.`,
  },
  {
    title: "Run on simulator",
    body: `Click Run circuit in the toolbar to open the execution dialog. Choose the Local simulator backend, set the number of shots (1–8192), and run. Results appear in the Measurement histogram panel and in the dialog preview. IBM Qasm Simulator and IBM Quantum hardware backends export Qiskit Runtime code for submission with your IBM Quantum account.`,
  },
];

export default function ComposerGuidePage() {
  return (
    <div className="page-container max-w-3xl">
      <div className="page-header mb-10">
        <Link
          href="/editor"
          className="text-xs text-[var(--color-brand)] hover:underline"
        >
          ← Open Composer
        </Link>
        <h1 className="page-title mt-4 text-3xl">Quantum Circuit Composer Guide</h1>
        <p className="page-description mt-3">
          Based on the{" "}
          <a
            href="https://quantum.cloud.ibm.com/docs/en/guides/composer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-brand)] hover:underline"
          >
            IBM Quantum Composer documentation
          </a>
          , adapted for the KUQCI Circuit Visualizer.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {"body" in section && section.body && (
                <CardDescription className="text-sm leading-relaxed">
                  {section.body}
                </CardDescription>
              )}
            </CardHeader>
            {"items" in section && section.items && (
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-[var(--color-muted-foreground)]"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
          <p>1. Open the Composer editor.</p>
          <p>2. Drag an H gate onto q[0], then a CX from q[0] to q[1].</p>
          <p>3. Watch the Probabilities and Q-sphere panels update live.</p>
          <p>4. Edit the Qiskit code on the right — changes sync to the canvas.</p>
          <p>5. Save your project or export Qiskit code via Run circuit.</p>
        </CardContent>
      </Card>
    </div>
  );
}
