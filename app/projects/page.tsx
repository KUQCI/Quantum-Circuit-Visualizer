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
import { useCircuitStore } from "@/store/circuit-store";
import { createEmptyCircuit } from "@/lib/circuit-schema";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Pencil,
  Save,
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
    const name = `New Circuit ${projects.length + 1}`;
    useCircuitStore.setState({
      circuit: createEmptyCircuit(name, 2, 0),
    });
    saveProject(name);
    router.push("/editor");
  };

  return (
    <div className="page-container">
      <div className="page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-description">
            Manage saved circuits stored in your browser
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => saveProject(circuit.name)}>
            <Save className="h-4 w-4" />
            Save Current
          </Button>
          <Button onClick={handleNewProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--color-muted-foreground)]">
              No projects yet. Build a circuit in the editor and save it here.
            </p>
            <Button className="mt-4" onClick={() => router.push("/editor")}>
              Go to Editor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
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
                <div className="mb-4 flex gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span>{project.circuit.qubits.length} qubits</span>
                  <span>{project.circuit.operations.length} gates</span>
                  <span>{project.circuit.classicalBits.length} classical bits</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleOpen(project.id)}>
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open
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
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete project?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from your browser storage.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteProject(deleteTarget.id);
        }}
      />
    </div>
  );
}
