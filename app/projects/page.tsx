"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageActions } from "@/components/navigation/PageActions";
import { QuantaEmptyState } from "@/components/mascot/QuantaEmptyState";
import { useCircuitStore, circuitHasContent } from "@/store/circuit-store";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { PROJECT_TEMPLATES } from "@/lib/project-templates";
import { formatDate } from "@/lib/utils";
import { quantaMessages } from "@/lib/mascot/messages";
import {
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Pencil,
  Save,
  GraduationCap,
  Download,
  Upload,
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const {
    projects,
    loadProjects,
    saveProject,
    openProject,
    renameProject,
    duplicateProject,
    deleteProject,
    resetCircuit,
    setCircuit,
    circuit,
  } = useCircuitStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = (id: string) => {
    if (openProject(id)) {
      router.push("/editor");
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleNewProject = () => {
    resetCircuit();
    const name = `Untitled Circuit`;
    useCircuitStore.setState({
      circuit: createEmptyCircuit(name, 2, 0),
    });
    saveProject(name);
    router.push("/editor");
  };

  const handleOpenTemplate = (templateId: string) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setCircuit(structuredClone(tpl.circuit));
    router.push("/editor");
  };

  const canSaveCurrent = circuitHasContent(circuit);

  return (
    <div className="page-container max-w-6xl">
      <div className="page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">
            Saved circuits stay in this browser — start from a template or a
            blank canvas
          </p>
        </div>
        <PageActions
          primary={[
            {
              label: "Start Blank Circuit",
              onClick: handleNewProject,
              icon: <Plus className="h-4 w-4" />,
            },
          ]}
          secondary={[
            {
              label: "Save Project",
              onClick: () => saveProject(circuit.name),
              icon: <Save className="h-4 w-4" />,
              disabled: !canSaveCurrent,
              title: canSaveCurrent
                ? "Save the current circuit to Projects"
                : "No active circuit to save — open Build first",
            },
            {
              label: "Import Qiskit",
              href: "/import",
              icon: <Upload className="h-4 w-4" />,
            },
            {
              label: "Export",
              href: "/export",
              icon: <Download className="h-4 w-4" />,
            },
            {
              label: "Continue Learning",
              href: "/learn",
              icon: <GraduationCap className="h-4 w-4" />,
            },
          ]}
        />
      </div>

      {projects.length === 0 ? (
        <div className="space-y-8">
          <QuantaEmptyState
            variant="empty"
            title={quantaMessages.projectsEmpty}
            description="Open a template, import Qiskit, or start from a blank canvas — then save to keep it here."
            actions={[
              {
                label: "Start Blank Circuit",
                onClick: handleNewProject,
                primary: true,
              },
              {
                label: "Open Bell State Template",
                onClick: () => handleOpenTemplate("tpl-bell"),
              },
              { label: "Import Qiskit", href: "/import" },
            ]}
          />

          <section>
            <h2 className="mb-1 text-lg font-semibold text-[var(--color-foreground)]">
              Sample circuits
            </h2>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              Open a template in Build — save it anytime to keep it in Projects.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECT_TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  className="transition-all hover:border-[var(--color-brand-border)]"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {tpl.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                      {tpl.qubits} qubits · {tpl.operations} operations
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleOpenTemplate(tpl.id)}
                      aria-label={`Open ${tpl.name} template`}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Open Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="transition-all hover:border-[var(--color-border-strong)]"
            >
              <CardHeader className="pb-2">
                <div className="space-y-1">
                  {editingId === project.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-full max-w-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(project.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        aria-label="Project name"
                      />
                      <Button size="sm" onClick={() => handleRename(project.id)}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <CardTitle className="text-base">{project.name}</CardTitle>
                  )}
                  <CardDescription>
                    Last edited {formatDate(project.updatedAt)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span>{project.circuit.qubits.length} qubits</span>
                  <span>{project.circuit.operations.length} operations</span>
                  <span>
                    {project.circuit.classicalBits.length} classical bits
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleOpen(project.id)}>
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open in Build
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(project.id);
                      setEditName(project.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateProject(project.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      openProject(project.id);
                      router.push("/export");
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteTarget({ id: project.id, name: project.name })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete project?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed from this browser.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteProject(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
