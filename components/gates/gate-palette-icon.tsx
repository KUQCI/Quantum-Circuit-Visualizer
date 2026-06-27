"use client";

import type { GateDefinition } from "./gate-definitions";

/** IBM Quantum Composer–style palette icons (24×24 viewBox). */
export function GatePaletteIcon({
  gate,
  className = "h-6 w-6",
}: {
  gate: GateDefinition;
  className?: string;
}) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (gate.type) {
    case "cx":
      return (
        <svg {...props}>
          <circle cx="12" cy="7" r="2.25" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
          <line x1="12" y1="9.25" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="17" r="3.25" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9.5" y1="17" x2="14.5" y2="17" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="14.5" x2="12" y2="19.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case "cz":
      return (
        <svg {...props}>
          <circle cx="12" cy="7" r="2.25" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
          <line x1="12" y1="9.25" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <text
            x="12"
            y="19"
            textAnchor="middle"
            fill="currentColor"
            fontSize="9"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            Z
          </text>
        </svg>
      );

    case "swap":
      return (
        <svg {...props}>
          <path
            d="M8 6 L8 10 M8 6 L6 8 M8 6 L10 8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 18 L16 14 M16 18 L14 16 M16 18 L18 16"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M14 10 L16 12 L14 14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M10 10 L8 12 L10 14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text x="7" y="21" fill="currentColor" fontSize="7" fontWeight="700" fontFamily="system-ui">
            ×
          </text>
          <text x="15" y="9" fill="currentColor" fontSize="7" fontWeight="700" fontFamily="system-ui">
            ×
          </text>
        </svg>
      );

    case "measure":
      return (
        <svg {...props}>
          <path
            d="M5 18 A7 7 0 0 1 19 18"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <line x1="5" y1="18" x2="19" y2="18" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="18" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="18" r="1.25" fill="currentColor" />
          {[6, 9, 12, 15, 18].map((x) => (
            <line
              key={x}
              x1={x}
              y1="18"
              x2={x}
              y2="16.5"
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </svg>
      );

    case "barrier":
      return (
        <svg {...props}>
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "reset":
      return (
        <svg {...props}>
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            |0⟩
          </text>
        </svg>
      );

    case "control":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        </svg>
      );

    case "ccx":
    case "rccx":
      return (
        <svg {...props}>
          <circle cx="8" cy="6" r="1.75" fill="currentColor" />
          <circle cx="16" cy="6" r="1.75" fill="currentColor" />
          <line x1="8" y1="7.75" x2="8" y2="13" stroke="currentColor" strokeWidth="1.25" />
          <line x1="16" y1="7.75" x2="16" y2="13" stroke="currentColor" strokeWidth="1.25" />
          <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.25" />
          <line x1="12" y1="13" x2="12" y2="15" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="12" cy="18" r="3" stroke="currentColor" strokeWidth="1.4" />
          <line x1="9.5" y1="18" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.4" />
          <line x1="12" y1="15.5" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.4" />
          {gate.type === "rccx" && (
            <text x="12" y="5" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700">
              R
            </text>
          )}
        </svg>
      );

    case "rc3x":
      return (
        <svg {...props}>
          <circle cx="6" cy="5.5" r="1.4" fill="currentColor" />
          <circle cx="12" cy="5.5" r="1.4" fill="currentColor" />
          <circle cx="18" cy="5.5" r="1.4" fill="currentColor" />
          <line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="17" r="2.75" stroke="currentColor" strokeWidth="1.3" />
          <line x1="9.75" y1="17" x2="14.25" y2="17" stroke="currentColor" strokeWidth="1.3" />
          <line x1="12" y1="14.75" x2="12" y2="19.25" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );

    case "id":
      return (
        <svg {...props}>
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x="12"
            y="15.5"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            I
          </text>
        </svg>
      );

    case "sx":
    case "sxdg":
      return (
        <svg {...props}>
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontSize={gate.type === "sxdg" ? "8" : "9"}
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {gate.type === "sxdg" ? "√X†" : "√X"}
          </text>
        </svg>
      );

    case "tdg":
    case "sdg":
      return (
        <svg {...props}>
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {gate.type === "tdg" ? "T†" : "S†"}
          </text>
        </svg>
      );

    default:
      return (
        <svg {...props}>
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontSize={gate.label.length > 3 ? "7" : gate.label.length > 2 ? "8" : "10"}
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {gate.label}
          </text>
        </svg>
      );
  }
}
