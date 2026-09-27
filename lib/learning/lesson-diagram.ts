import {
  getGateLabel,
  qubitIndexFromId,
  type Circuit,
} from "@/lib/circuit-schema";
import { getExecutionLayers } from "@/lib/circuit-layout";

export interface LessonDiagramItem {
  id: string;
  type: string;
  label: string;
  targets: number[];
  controls: number[];
}

export interface LessonDiagramColumn {
  step: number;
  items: LessonDiagramItem[];
}

export interface LessonDiagram {
  columns: LessonDiagramColumn[];
  qubitCount: number;
}

export function buildLessonDiagram(circuit: Circuit): LessonDiagram {
  const layers = getExecutionLayers(
    circuit.operations.filter((operation) => operation.type !== "barrier")
  );

  return {
    qubitCount: circuit.qubits.length,
    columns: layers.map((layer, index) => ({
      step: index + 1,
      items: layer.map((operation) => ({
        id: operation.id,
        type: operation.type,
        label: getGateLabel(operation.type),
        targets: operation.targets.map(qubitIndexFromId),
        controls: operation.controls.map(qubitIndexFromId),
      })),
    })),
  };
}
