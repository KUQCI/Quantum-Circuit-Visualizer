import { describe, expect, it } from "vitest";
import { useQuantaBuddyStore } from "@/store/quanta-buddy-store";

describe("quanta buddy store", () => {
  it("toggles visibility", () => {
    useQuantaBuddyStore.setState({ enabled: true });
    useQuantaBuddyStore.getState().toggle();
    expect(useQuantaBuddyStore.getState().enabled).toBe(false);
    useQuantaBuddyStore.getState().toggle();
    expect(useQuantaBuddyStore.getState().enabled).toBe(true);
  });

  it("increments the call request without changing visibility", () => {
    useQuantaBuddyStore.setState({ enabled: true, callRequest: 0 });
    useQuantaBuddyStore.getState().callQuanta();
    useQuantaBuddyStore.getState().callQuanta();
    expect(useQuantaBuddyStore.getState().callRequest).toBe(2);
    expect(useQuantaBuddyStore.getState().enabled).toBe(true);
  });

  it("toggles quack sounds", () => {
    useQuantaBuddyStore.setState({ sound: true });
    useQuantaBuddyStore.getState().toggleSound();
    expect(useQuantaBuddyStore.getState().sound).toBe(false);
  });

  it("sets the selected hat", () => {
    useQuantaBuddyStore.getState().setHat("crown");
    expect(useQuantaBuddyStore.getState().hat).toBe("crown");
  });

  it("sets the selected skin", () => {
    useQuantaBuddyStore.getState().setSkin("golden");
    expect(useQuantaBuddyStore.getState().skin).toBe("golden");
  });

  it("persists enabled, sound, hat, and skin", () => {
    const state = useQuantaBuddyStore.getState();
    const partialize = useQuantaBuddyStore.persist.getOptions().partialize;

    expect(
      partialize?.({
        ...state,
        enabled: false,
        sound: true,
        hat: "crown",
        skin: "golden",
        callRequest: 42,
      })
    ).toEqual({
      enabled: false,
      sound: true,
      hat: "crown",
      skin: "golden",
    });
  });
});
