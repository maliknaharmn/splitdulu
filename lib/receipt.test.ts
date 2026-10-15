import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateBill, createBlankBill } from "./bill";
import { renderReceipt } from "./receipt";

function largeBill() {
  const bill = createBlankBill("render");
  bill.mode = "itemized";
  bill.participants = Array.from({ length: 12 }, (_, index) => ({ id: `person-${index}`, name: `Orang ${index + 1}`, quickAmount: 0 }));
  bill.items = Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, name: `Menu ${index + 1}`, unitPrice: 10_000, quantity: 2, participantIds: bill.participants.map((person) => person.id) }));
  bill.payerId = "person-0";
  return bill;
}

function mockCanvas() {
  const context = {
    beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), fillRect: vi.fn(), arc: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(),
    fillText: vi.fn(), measureText: (value: string) => ({ width: value.length * 10 }),
  };
  const canvas = {
    width: 0, height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" }))),
  };
  const createElement = vi.fn(() => canvas);
  vi.stubGlobal("document", { createElement, fonts: { load: vi.fn().mockResolvedValue([]) } });
  return { context, canvas, createElement };
}

beforeEach(() => vi.stubGlobal("Path2D", class {}));
afterEach(() => vi.unstubAllGlobals());

describe("single PNG rendering", () => {
  it("draws all 240 item rows and one summary per person on one canvas", async () => {
    const { context, canvas, createElement } = mockCanvas();
    const bill = largeBill();
    const rendered = await renderReceipt(bill, calculateBill(bill), "full");
    expect(createElement).toHaveBeenCalledTimes(1);
    expect(canvas.toBlob).toHaveBeenCalledTimes(1);
    expect(rendered).toMatchObject({ width: 1080, height: 13613 });
    expect(rendered.blob.type).toBe("image/png");
    const calls = context.fillText.mock.calls;
    expect(calls.filter(([value]) => /^Menu \d+$/.test(value))).toHaveLength(240);
    for (const label of ["Subtotal", "Diskon", "Pajak", "Service"]) {
      expect(calls.filter(([value]) => value === label)).toHaveLength(12);
    }
    expect(calls.filter(([value]) => value.includes("lanjutan") || value.includes("Bersambung"))).toHaveLength(0);
    expect(calls).toContainEqual(["dibuat dengan splitdulu.vercel.app", 142, rendered.height - 149]);
    expect(calls.every(([, , y]) => y < rendered.height - 86)).toBe(true);
  });

  it("draws all personal items in one column above the summary", async () => {
    const { context } = mockCanvas();
    const bill = largeBill();
    const rendered = await renderReceipt(bill, calculateBill(bill), "person-0");
    expect(rendered.height).toBe(1747);
    const items = context.fillText.mock.calls.filter(([value]) => /^Menu \d+ ×2$/.test(value));
    expect(items).toHaveLength(20);
    expect(items.every(([, x]) => x === 142)).toBe(true);
    const summary = context.fillText.mock.calls.find(([value]) => value === "Subtotal");
    expect(summary?.[2]).toBeGreaterThan(items.at(-1)![2]);
  });

  it("rejects invalid bills and missing people before allocating a canvas", async () => {
    const { createElement } = mockCanvas();
    const bill = createBlankBill();
    await expect(renderReceipt(bill, calculateBill(bill), "full")).rejects.toThrow("Bill belum siap");
    const valid = largeBill();
    await expect(renderReceipt(valid, calculateBill(valid), "missing")).rejects.toThrow("tidak ditemukan");
    expect(createElement).not.toHaveBeenCalled();
  });

  it("reports PNG encoding failures instead of offering a broken download", async () => {
    const { canvas } = mockCanvas();
    canvas.toBlob.mockImplementation((callback) => callback(null));
    const bill = largeBill();
    await expect(renderReceipt(bill, calculateBill(bill), "full")).rejects.toThrow("Gambar PNG tidak berhasil dibuat");
  });
});
