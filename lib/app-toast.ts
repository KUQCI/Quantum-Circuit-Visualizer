export const APP_TOAST_EVENT = "qci:app-toast";

export function showAppToast(message: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(APP_TOAST_EVENT, { detail: { message } })
    );
  }
}
