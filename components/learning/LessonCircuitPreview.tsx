"use client";

import { useEffect, useMemo, useState } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import {
  computeStepSnapshots,
  explainStep,
} from "@/lib/step-explanations";
import { MAX_SIMULATION_QUBITS } from "@/lib/quantum-state";
import {
  buildLessonDiagram,
  type LessonDiagramItem,
} from "@/lib/learning/lesson-diagram";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import { QubitPhaseDisks } from "@/components/visualizations/phase-disk";

interface LessonCircuitPreviewProps {
  circuit: Circuit;
}

const LABEL_WIDTH = 58;
const COLUMN_WIDTH = 68;
const TOP_PADDING = 22;
const ROW_HEIGHT = 36;
const CLASSICAL_ROW_HEIGHT = 24;

function itemRows(item: LessonDiagramItem): number[] {
  return [...new Set([...item.controls, ...item.targets])].filter((row) =>
    Number.isFinite(row)
  );
}

function rowY(row: number): number {
  return TOP_PADDING + row * ROW_HEIGHT;
}

function renderGate(
  item: LessonDiagramItem,
  circuit: Circuit,
  centerX: number,
  columnStep: number,
  qubitCount: number
) {
  const sourceOperation = circuit.operations.find(
    (operation) => operation.id === item.id
  );
  const rows = itemRows(item);
  const firstRow = rows[0] ?? 0;
  const lastRow = rows[rows.length - 1] ?? firstRow;
  const targetRows = item.targets.length > 0 ? item.targets : [firstRow];
  const classicalTargets = sourceOperation?.classicalTargets ?? [];
  const targetY = (target: number) => rowY(target);
  const classicalStart = TOP_PADDING + qubitCount * ROW_HEIGHT + 10;

  return (
    <g key={`${item.id}-${columnStep}`}>
      {rows.length > 1 && (
        <line
          x1={centerX}
          y1={rowY(firstRow)}
          x2={centerX}
          y2={rowY(lastRow)}
          stroke="var(--color-foreground)"
          strokeOpacity={0.65}
          strokeWidth={1.5}
        />
      )}
      {item.controls.map((control) => (
        <circle
          key={`${item.id}-control-${control}`}
          cx={centerX}
          cy={targetY(control)}
          r={4}
          fill="var(--color-foreground)"
        />
      ))}
      {item.type === "swap" && targetRows.length >= 2 ? (
        targetRows.map((target) => (
          <g key={`${item.id}-swap-${target}`}>
            <line
              x1={centerX - 6}
              y1={targetY(target) - 6}
              x2={centerX + 6}
              y2={targetY(target) + 6}
              stroke="var(--color-brand)"
              strokeWidth={2}
            />
            <line
              x1={centerX + 6}
              y1={targetY(target) - 6}
              x2={centerX - 6}
              y2={targetY(target) + 6}
              stroke="var(--color-brand)"
              strokeWidth={2}
            />
          </g>
        ))
      ) : (
        targetRows.map((target) => (
          <g key={`${item.id}-target-${target}`}>
            <rect
              x={centerX - 22}
              y={targetY(target) - 12}
              width={44}
              height={24}
              rx={5}
              fill="var(--color-background)"
              stroke="var(--color-brand)"
              strokeWidth={1.5}
            />
            <text
              x={centerX}
              y={targetY(target) + 4}
              fill="var(--color-foreground)"
              fontSize={10}
              fontWeight={600}
              textAnchor="middle"
            >
              {item.label}
            </text>
          </g>
        ))
      )}
      {item.type === "measure" &&
        classicalTargets.map((classicalTarget) => {
          const classicalIndex = Number.parseInt(
            classicalTarget.replace("c", ""),
            10
          );
          if (!Number.isFinite(classicalIndex)) return null;
          const classicalY =
            classicalStart + classicalIndex * CLASSICAL_ROW_HEIGHT;
          return (
            <g key={`${item.id}-${classicalTarget}`}>
              <line
                x1={centerX}
                y1={targetY(targetRows[0]) + 13}
                x2={centerX}
                y2={classicalY - 9}
                stroke="var(--color-brand)"
                strokeDasharray="3 3"
              />
              <rect
                x={centerX - 18}
                y={classicalY - 9}
                width={36}
                height={18}
                rx={4}
                fill="var(--color-background)"
                stroke="var(--color-border)"
              />
              <text
                x={centerX}
                y={classicalY + 4}
                fill="var(--color-muted-foreground)"
                fontSize={9}
                textAnchor="middle"
              >
                {classicalTarget}
              </text>
            </g>
          );
        })}
    </g>
  );
}

function LessonCircuitSvg({
  circuit,
  selectedStep,
}: {
  circuit: Circuit;
  selectedStep: number;
}) {
  const diagram = buildLessonDiagram(circuit);
  const columnCount = Math.max(diagram.columns.length, 1);
  const classicalCount = circuit.classicalBits.length;
  const width = LABEL_WIDTH + columnCount * COLUMN_WIDTH + 18;
  const height =
    TOP_PADDING +
    Math.max(diagram.qubitCount - 1, 0) * ROW_HEIGHT +
    24 +
    (classicalCount > 0 ? classicalCount * CLASSICAL_ROW_HEIGHT + 8 : 0);
  const description = `Circuit diagram: ${diagram.qubitCount} qubits, ${circuit.operations.filter((operation) => operation.type !== "barrier").length} gates`;

  return (
    <div className="overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={description}
        className="min-w-full"
      >
        <title>{description}</title>
        {diagram.columns.map((column, index) => {
          const x = LABEL_WIDTH + index * COLUMN_WIDTH;
          return selectedStep === column.step ? (
            <rect
              key={`highlight-${column.step}`}
              x={x + 2}
              y={5}
              width={COLUMN_WIDTH - 4}
              height={height - 10}
              rx={6}
              fill="var(--color-brand)"
              fillOpacity={0.1}
            />
          ) : null;
        })}
        {circuit.qubits.map((qubit, index) => {
          const y = rowY(index);
          return (
            <g key={qubit.id}>
              <text
                x={4}
                y={y + 4}
                fill="var(--color-muted-foreground)"
                fontSize={10}
              >
                {qubit.label}
              </text>
              <line
                x1={LABEL_WIDTH}
                y1={y}
                x2={width - 8}
                y2={y}
                stroke="var(--color-border)"
              />
            </g>
          );
        })}
        {classicalCount > 0 &&
          circuit.classicalBits.map((bit, index) => (
            <text
              key={bit.id}
              x={4}
              y={
                TOP_PADDING +
                circuit.qubits.length * ROW_HEIGHT +
                10 +
                index * CLASSICAL_ROW_HEIGHT +
                4
              }
              fill="var(--color-muted-foreground)"
              fontSize={9}
            >
              {bit.label}
            </text>
          ))}
        {diagram.columns.map((column, index) => {
          const centerX = LABEL_WIDTH + index * COLUMN_WIDTH + COLUMN_WIDTH / 2;
          return column.items.map((item) =>
            renderGate(item, circuit, centerX, column.step, diagram.qubitCount)
          );
        })}
      </svg>
    </div>
  );
}

export function LessonCircuitPreview({
  circuit,
}: LessonCircuitPreviewProps) {
  const snapshots = useMemo(() => {
    try {
      return computeStepSnapshots(circuit);
    } catch {
      return [];
    }
  }, [circuit]);
  const diagram = useMemo(() => buildLessonDiagram(circuit), [circuit]);
  const [selectedStep, setSelectedStep] = useState(
    () => Math.max(0, snapshots.length - 1)
  );

  useEffect(() => {
    setSelectedStep(Math.max(0, snapshots.length - 1));
  }, [snapshots]);

  const safeStep = Math.min(
    Math.max(0, selectedStep),
    Math.max(0, snapshots.length - 1)
  );
  const snapshot = snapshots[safeStep];
  const explanation = snapshot ? explainStep(snapshot, circuit) : null;
  const simulationError =
    snapshot?.after.error ??
    (circuit.qubits.length > MAX_SIMULATION_QUBITS
      ? `Simulation is limited to ${MAX_SIMULATION_QUBITS} qubits.`
      : snapshots.length === 0
        ? "This circuit could not be simulated."
        : null);
  const hasOperations = circuit.operations.some(
    (operation) => operation.type !== "barrier"
  );

  return (
    <div className="space-y-3">
      <LessonCircuitSvg circuit={circuit} selectedStep={safeStep} />
      {hasOperations && (
        <div
          className="flex flex-wrap gap-1"
          aria-label="Circuit preview steps"
        >
          {snapshots.map((step) => (
            <button
              key={step.step}
              type="button"
              aria-pressed={safeStep === step.step}
              onClick={() => setSelectedStep(step.step)}
              className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] font-medium text-[var(--color-muted-foreground)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-foreground)] aria-pressed:border-[var(--color-brand)] aria-pressed:bg-[var(--color-brand-subtle)] aria-pressed:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {step.step === 0 ? "Start" : `Step ${step.step}`}
            </button>
          ))}
        </div>
      )}
      {snapshot && (
        <>
          <div className="h-[170px] min-h-0 rounded border border-[var(--color-border)] p-1">
            <ProbabilityChart
              probabilities={snapshot.after.probabilities}
              numQubits={snapshot.after.numQubits}
              error={snapshot.after.error}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded border border-[var(--color-border)] px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Qubit phases
            </span>
            <div className="flex items-center gap-3">
              <QubitPhaseDisks
                amplitudes={snapshot.after.amplitudes}
                numQubits={snapshot.after.numQubits}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted-foreground)]">
              {circuit.qubits.map((qubit) => (
                <span key={qubit.id}>{qubit.label}</span>
              ))}
            </div>
          </div>
          {explanation && (
            <div className="space-y-1 text-[11px]">
              <p className="font-medium text-[var(--color-foreground)]">
                {explanation.title}
              </p>
              <ul className="space-y-0.5 text-[var(--color-muted-foreground)]">
                {explanation.computed.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {!snapshot && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {simulationError}
        </p>
      )}
      {diagram.qubitCount > MAX_SIMULATION_QUBITS && (
        <p className="text-xs text-[var(--color-warning)]">
          Preview diagram shown without simulation for circuits larger than{" "}
          {MAX_SIMULATION_QUBITS} qubits.
        </p>
      )}
    </div>
  );
}
