import { describe, expect, it } from "vitest";

import { formatRupiah, parsePercentInput, parseRupiahInput } from "./format";

describe("Indonesian inputs", () => {
  it("accepts rupiah integers and k shorthand", () => {
    expect(parseRupiahInput("31.000")).toBe(31_000);
    expect(parseRupiahInput("Rp 31k")).toBe(31_000);
    expect(parseRupiahInput("31,5k")).toBe(31_500);
    expect(parseRupiahInput("31,5")).toBeNull();
    expect(formatRupiah(31_500)).toBe("Rp31.500");
  });

  it("stores percentages as basis points without floating point drift", () => {
    expect(parsePercentInput("10,5")).toBe(1_050);
    expect(parsePercentInput("10.25%") ).toBe(1_025);
    expect(parsePercentInput("10.123")).toBeNull();
  });
});
