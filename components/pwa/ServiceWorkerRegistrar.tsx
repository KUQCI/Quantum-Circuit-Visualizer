"use client";

import { useEffect, useRef, useState } from "react";
import { showAppToast } from "@/lib/app-toast";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ENABLED = process.env.NEXT_PUBLIC_ENABLE_SW === "true";

export function ServiceWorkerRegistrar() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadAfterControllerChange = useRef(false);
  const hasReloaded = useRef(false);

  useEffect(() => {
    if (
      !ENABLED ||
      !("serviceWorker" in navigator) ||
      window.self !== window.top
    ) {
      return;
    }

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let installingWorker: ServiceWorker | null = null;
    let onInstallStateChange: (() => void) | null = null;
    let hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      setWaitingWorker(null);
      if (!hadController) {
        hadController = true;
        let shouldShowReadyToast = false;
        try {
          shouldShowReadyToast =
            localStorage.getItem("qcv-offline-ready") !== "true";
          if (shouldShowReadyToast) {
            localStorage.setItem("qcv-offline-ready", "true");
          }
        } catch {
          shouldShowReadyToast = false;
        }
        if (shouldShowReadyToast) {
          showAppToast(
            "Ready to work offline — lessons and your circuits are saved on this device"
          );
        }
      }
      if (
        reloadAfterControllerChange.current &&
        !hasReloaded.current
      ) {
        hasReloaded.current = true;
        window.location.reload();
      }
    };

    const onOffline = () =>
      showAppToast(
        "You're offline — the editor and lessons still work. Ask Quanta needs a connection."
      );
    const onOnline = () => showAppToast("Back online");

    const onUpdateFound = () => {
      installingWorker = registration?.installing ?? null;
      onInstallStateChange = () => {
        if (
          installingWorker?.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          setWaitingWorker(registration?.waiting ?? installingWorker);
        }
      };
      installingWorker?.addEventListener("statechange", onInstallStateChange);
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register(`${BASE}/sw.js`, {
          scope: `${BASE}/`,
        });
        if (disposed) return;
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", onUpdateFound);
        if (registration.installing) onUpdateFound();
      } catch {
        return;
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      registration?.removeEventListener("updatefound", onUpdateFound);
      if (installingWorker && onInstallStateChange) {
        installingWorker.removeEventListener(
          "statechange",
          onInstallStateChange
        );
      }
    };
  }, []);

  if (!ENABLED || !waitingWorker) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-foreground)] shadow-xl"
      role="status"
      aria-live="polite"
    >
      <span>A new version is ready</span>
      <button
        type="button"
        className="rounded-md bg-[var(--color-accent)] px-3 py-1 font-semibold text-[var(--color-accent-foreground)]"
        onClick={() => {
          reloadAfterControllerChange.current = true;
          waitingWorker.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Reload
      </button>
      <button
        type="button"
        className="rounded-md px-1 text-lg leading-none text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        aria-label="Dismiss update notice"
        onClick={() => setWaitingWorker(null)}
      >
        ×
      </button>
    </div>
  );
}
