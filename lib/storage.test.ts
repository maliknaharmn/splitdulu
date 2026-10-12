import { afterEach, describe, expect, it, vi } from "vitest";

import { createBlankBill } from "./bill";
import { readPersistedState, writePersistedState } from "./storage";

afterEach(() => vi.unstubAllGlobals());

function savedBill(id: string) {
  const bill = createBlankBill(id);
  bill.participants[0] = { id: "a", name: "Malik", quickAmount: 60_000 };
  bill.participants[1] = { id: "b", name: "Fadel", quickAmount: 40_000 };
  bill.quickSubtotal = 100_000;
  bill.payerId = "b";
  return bill;
}

describe("local bill storage", () => {
  it("restores a draft and at most five valid recent bills", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } });
    const draft = savedBill("draft");
    const recent = Array.from({ length: 6 }, (_, index) => savedBill(`bill-${index}`));
    expect(writePersistedState(draft, recent)).toBeNull();
    const restored = readPersistedState();
    expect(restored.draft?.id).toBe("draft");
    expect(restored.recent.map((bill) => bill.id)).toEqual(["bill-0", "bill-1", "bill-2", "bill-3", "bill-4"]);
  });

  it("ignores malformed or unknown-version payloads", () => {
    let payload = "not-json";
    vi.stubGlobal("window", { localStorage: { getItem: () => payload } });
    expect(readPersistedState().draft).toBeNull();
    payload = JSON.stringify({ version: 2, draft: savedBill("old") });
    expect(readPersistedState().recent).toEqual([]);
  });

  it("keeps the session usable when storage is denied", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } } });
    expect(readPersistedState().error).toMatch(/tidak tersedia/);
    expect(writePersistedState(savedBill("draft"), [])).toMatch(/tidak tersedia/);
  });
});
