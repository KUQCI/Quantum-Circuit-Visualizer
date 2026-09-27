import { beforeEach, describe, expect, it } from "vitest";
import { useQuantaPopoutStore } from "@/store/quanta-popout-store";

describe("quanta popout store", () => {
  beforeEach(() => {
    useQuantaPopoutStore.getState().dismiss();
  });

  it("sets messages with incrementing ids", () => {
    const message = { text: "First lesson note", variant: "hint" as const };
    useQuantaPopoutStore.getState().say(message);
    const first = useQuantaPopoutStore.getState().message;

    useQuantaPopoutStore.getState().say({
      text: "Second lesson note",
      variant: "success",
    });
    const second = useQuantaPopoutStore.getState().message;

    expect(first).toMatchObject(message);
    expect(second).toMatchObject({
      text: "Second lesson note",
      variant: "success",
    });
    expect(second?.id).toBe((first?.id ?? 0) + 1);
  });

  it("dismisses the current message", () => {
    useQuantaPopoutStore.getState().say({
      text: "Dismiss me",
      variant: "default",
    });
    useQuantaPopoutStore.getState().dismiss();

    expect(useQuantaPopoutStore.getState().message).toBeNull();
  });

  it("replaces the previous message", () => {
    useQuantaPopoutStore.getState().say({
      text: "Old message",
      variant: "hint",
    });
    useQuantaPopoutStore.getState().say({
      text: "New message",
      variant: "error",
    });

    expect(useQuantaPopoutStore.getState().message?.text).toBe("New message");
  });
});
