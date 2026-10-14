"use client";

import { useEffect, useMemo, useState } from "react";
import type { Circuit } from "@/lib/circuit-schema";
import {
  computeStepSnapshots,
  explainStep,
} from "@/lib/step-explanations";
import { useElementSize } from "@/lib/use-element-size";
import { MAX_SIMULATION_QUBITS } from "@/lib/quantum-state";
import {
  buildLessonDiagram,
  type LessonDiagramItem,
} from "@/lib/learning/lesson-diagram";
import { ProbabilityChart } from "@/components/visualizations/probability-chart";
import { QubitPhaseDisks } from "@/components/visualizations/phase-disk";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";

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

function rowY(
  row: number,
  topPadding = TOP_PADDING,
  rowHeight = ROW_HEIGHT
): number {
  return topPadding + row * rowHeight;
}

function renderGate(
  item: LessonDiagramItem,
  circuit: Circuit,
  centerX: number,
  columnStep: number,
  qubitCount: number,
  options?: {
    animate: boolean;
    highlight: boolean;
    delayMs: number;
    gateWidth?: number;
    gateHeight?: number;
    fontSize?: number;
    topPadding?: number;
    rowHeight?: number;
  }
) {
  const sourceOperation = circuit.operations.find(
    (operation) => operation.id === item.id
  );
  const rows = itemRows(item);
  const firstRow = rows[0] ?? 0;
  const lastRow = rows[rows.length - 1] ?? firstRow;
  const targetRows = item.targets.length > 0 ? item.targets : [firstRow];
  const classicalTargets = sourceOperation?.classicalTargets ?? [];
  const topPadding = options?.topPadding ?? TOP_PADDING;
  const rowHeight = options?.rowHeight ?? ROW_HEIGHT;
  const gateWidth = options?.gateWidth ?? 44;
  const gateHeight = options?.gateHeight ?? 24;
  const targetY = (target: number) => rowY(target, topPadding, rowHeight);
  const classicalStart = topPadding + qubitCount * rowHeight + 10;

  return (
    <g
      key={`${item.id}-${columnStep}`}
      className={[
        options?.animate ? "storyboard-gate-drop" : "",
        options?.highlight ? "storyboard-gate-glow" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        options?.animate
          ? { animationDelay: `${options.delayMs}ms` }
          : undefined
      }
    >
      {rows.length > 1 && (
        <line
          x1={centerX}
          y1={rowY(firstRow, topPadding, rowHeight)}
          x2={centerX}
          y2={rowY(lastRow, topPadding, rowHeight)}
          stroke="var(--color-foreground)"
          strokeOpacity={0.65}
          strokeWidth={options?.gateHeight ? 2 : 1.5}
        />
      )}
      {item.controls.map((control) => (
        <circle
          key={`${item.id}-control-${control}`}
          cx={centerX}
          cy={targetY(control)}
          r={options?.gateHeight ? 5 : 4}
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
              x={centerX - gateWidth / 2}
              y={targetY(target) - gateHeight / 2}
              width={gateWidth}
              height={gateHeight}
              rx={5}
              fill="var(--color-background)"
              stroke="var(--color-brand)"
              strokeWidth={options?.gateHeight ? 2 : 1.5}
            />
            <text
              x={centerX}
              y={
                targetY(target) +
                (options?.fontSize ? options.fontSize * 0.35 : 4)
              }
              fill="var(--color-foreground)"
              fontSize={options?.fontSize ?? 10}
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

export function LessonCircuitSvg({
  circuit,
  selectedStep,
  visibleSteps,
  animatedOperationIds = [],
  highlightedOperationIds = [],
  fillContainer = false,
}: {
  circuit: Circuit;
  selectedStep: number;
  visibleSteps?: number;
  animatedOperationIds?: string[];
  highlightedOperationIds?: string[];
  fillContainer?: boolean;
}) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const diagram = buildLessonDiagram(circuit);
  const visibleColumns = diagram.columns.filter(
    (column) => visibleSteps === undefined || column.step <= visibleSteps
  );
  const columnCount = Math.max(diagram.columns.length, 1);
  const classicalCount = circuit.classicalBits.length;
  const width = LABEL_WIDTH + columnCount * COLUMN_WIDTH + 18;
  const compactStoryboard =
    fillContainer && size.width > 0 && size.width < 500;
  const topPadding = compactStoryboard ? 12 : TOP_PADDING;
  const rowHeight = fillContainer
    ? diagram.qubitCount > 2
      ? compactStoryboard
        ? 24
        : 46
      : diagram.qubitCount === 2
        ? 44
        : ROW_HEIGHT
    : ROW_HEIGHT;
  const availableColumnWidth = size.width
    ? (size.width - LABEL_WIDTH - 18) / columnCount
    : COLUMN_WIDTH;
  const columnWidth =
    fillContainer && size.width
      ? Math.max(availableColumnWidth, 48)
      : COLUMN_WIDTH;
  const svgWidth =
    fillContainer && size.width
      ? Math.max(size.width, LABEL_WIDTH + columnCount * columnWidth + 18)
      : width;
  const height =
    classicalCount > 0
      ? topPadding +
        diagram.qubitCount * rowHeight +
        19 +
        (classicalCount - 1) * CLASSICAL_ROW_HEIGHT
      : topPadding + Math.max(diagram.qubitCount - 1, 0) * rowHeight + 24;
  const description = `Circuit diagram: ${diagram.qubitCount} qubits, ${circuit.operations.filter((operation) => operation.type !== "barrier").length} gates`;

  return (
    <div
      ref={fillContainer ? containerRef : undefined}
      className={
        fillContainer
          ? "h-full w-full overflow-hidden"
          : "overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2"
      }
    >
      <svg
        width={svgWidth}
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        role="img"
        aria-label={description}
        className={fillContainer ? "h-full w-full" : "min-w-full"}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{description}</title>
        {visibleColumns.map((column, index) => {
          const x = LABEL_WIDTH + index * columnWidth;
          return selectedStep === column.step ? (
            <rect
              key={`highlight-${column.step}`}
              x={x + 2}
              y={5}
              width={columnWidth - 4}
              height={height - 10}
              rx={6}
              fill="var(--color-brand)"
              fillOpacity={0.1}
            />
          ) : null;
        })}
        {circuit.qubits.map((qubit, index) => {
          const y = rowY(index, topPadding, rowHeight);
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
                x2={svgWidth - 8}
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
                topPadding +
                circuit.qubits.length * rowHeight +
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
        {visibleColumns.map((column, index) => {
          const centerX =
            LABEL_WIDTH + index * columnWidth + columnWidth / 2;
          return (
            <g
              key={`column-${column.step}`}
              className={
                column.step === visibleSteps
                  ? "walkthrough-gate-drop"
                  : undefined
              }
            >
              {column.items.map((item, index) =>
                renderGate(
                  item,
                  circuit,
                  centerX,
                  column.step,
                  diagram.qubitCount,
                  {
                    animate: animatedOperationIds.includes(item.id),
                    highlight: highlightedOperationIds.includes(item.id),
                    delayMs: index * 180,
                    gateWidth: fillContainer
                      ? diagram.qubitCount > 2
                        ? compactStoryboard
                          ? 52
                          : 68
                        : 68
                      : undefined,
                    gateHeight: fillContainer
                      ? diagram.qubitCount > 2
                        ? compactStoryboard
                          ? 22
                          : 40
                        : 40
                      : undefined,
                    fontSize: fillContainer
                      ? diagram.qubitCount > 2
                        ? compactStoryboard
                          ? 11
                          : 16
                        : 16
                      : undefined,
                    topPadding,
                    rowHeight,
                  }
                )
              )}
            </g>
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
  const sayQuanta = useQuantaPopoutStore((state) => state.say);

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
              onClick={() => {
                setSelectedStep(step.step);
                const stepExplanation = explainStep(step, circuit);
                sayQuanta({
                  text: stepExplanation.computed.join(" "),
                  title: stepExplanation.title,
                  variant: "hint",
                  imageVariant: "thinking",
                });
              }}
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
