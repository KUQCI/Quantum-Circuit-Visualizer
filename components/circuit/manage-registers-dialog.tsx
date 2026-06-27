"use client";

import { useState } from "react";
import { useCircuitStore } from "@/store/circuit-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManageRegistersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageRegistersDialog({
  open,
  onOpenChange,
}: ManageRegistersDialogProps) {
  const circuit = useCircuitStore((s) => s.circuit);
  const setRegisterCounts = useCircuitStore((s) => s.setRegisterCounts);
  const [qubits, setQubits] = useState(circuit.qubits.length);
  const [classical, setClassical] = useState(circuit.classicalBits.length);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setQubits(circuit.qubits.length);
      setClassical(circuit.classicalBits.length);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage registers</DialogTitle>
          <DialogDescription>
            Set the number of quantum and classical registers for your circuit.
            Operations on removed registers will be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Qubits
            </label>
            <Input
              type="number"
              min={1}
              max={16}
              value={qubits}
              onChange={(e) => setQubits(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="mt-1 h-8"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Classical bits
            </label>
            <Input
              type="number"
              min={0}
              max={16}
              value={classical}
              onChange={(e) =>
                setClassical(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="mt-1 h-8"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setRegisterCounts(qubits, classical);
                onOpenChange(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
