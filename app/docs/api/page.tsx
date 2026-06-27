import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageActions } from "@/components/navigation/PageActions";
import { IBM_QUANTUM_API_LINKS } from "@/lib/code-adapters";
import { CODE_LANGUAGES } from "@/lib/code-adapters";
import { ExternalLink, PenLine, GraduationCap, Upload } from "lucide-react";

export default function ApiReferencePage() {
  return (
    <div className="page-container max-w-3xl">
      <div className="page-header mb-10">
        <h1 className="page-title text-3xl">IBM Quantum API Reference</h1>
        <p className="page-description mt-3">
          Official IBM Quantum documentation for running circuits built in this
          visualizer. Export your circuit as Qiskit or OpenQASM, then use these
          APIs to execute on simulators or real hardware.
        </p>
        <PageActions
          className="mt-4"
          primary={[
            { label: "Open Build", href: "/editor", icon: <PenLine className="h-4 w-4" /> },
          ]}
          secondary={[
            { label: "Import Example", href: "/import", icon: <Upload className="h-4 w-4" /> },
            { label: "Learn Basics", href: "/learn", icon: <GraduationCap className="h-4 w-4" /> },
          ]}
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Supported code formats</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {CODE_LANGUAGES.map((lang) => (
              <li key={lang.id} className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{lang.label}</div>
                  <div className="text-sm text-[var(--color-muted-foreground)]">
                    {lang.description}
                    {lang.bidirectional ? " · Bidirectional sync" : " · Export only"}
                  </div>
                </div>
                {lang.docsUrl && (
                  <a
                    href={lang.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-brand)] hover:underline"
                  >
                    Docs
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">IBM Quantum Platform APIs</h2>
        {IBM_QUANTUM_API_LINKS.map((api) => (
          <Card key={api.url}>
            <CardHeader className="pb-2">
              <a
                href={api.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-base font-medium text-[var(--color-brand)] hover:underline"
              >
                {api.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardHeader>
            <CardContent>
              <CardDescription>{api.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Quick workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
          <p>1. Build a circuit in Build mode.</p>
          <p>2. Switch the code panel to Qiskit or OpenQASM — edits sync both ways.</p>
          <p>3. Export as Runtime snippet to run on IBM Quantum hardware.</p>
          <p>
            4. Use the{" "}
            <a
              href="https://quantum.cloud.ibm.com/docs/en/api/qiskit-ibm-runtime"
              className="text-[var(--color-brand)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Qiskit IBM Runtime
            </a>{" "}
            or REST APIs to submit jobs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
