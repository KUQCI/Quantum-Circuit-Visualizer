import type { WalkthroughBackup } from "@/store/editor-ui-store";
import { useCircuitStore } from "@/store/circuit-store";

export function restoreWalkthroughBackup(
  backup: WalkthroughBackup | null
): boolean {
  if (!backup) return false;
  useCircuitStore.getState().setCircuit(backup.circuit);
  useCircuitStore.setState({ currentProjectId: backup.projectId });
  return true;
}
