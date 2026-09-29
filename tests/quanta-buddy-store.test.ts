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

  it("persists only enabled", () => {
    const state = useQuantaBuddyStore.getState();
    const partialize = useQuantaBuddyStore.persist.getOptions().partialize;

    expect(partialize?.({ ...state, enabled: false, callRequest: 42 })).toEqual({
      enabled: false,
    });
  });
});
