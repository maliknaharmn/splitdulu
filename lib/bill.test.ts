import { describe, expect, it } from "vitest";

import { allocate, calculateBill, createBlankBill, type BillDraft } from "./bill";

function validQuickBill(): BillDraft {
  const bill = createBlankBill("test");
  bill.participants = [
    { id: "a", name: "Malik", quickAmount: 31_000 },
    { id: "b", name: "Fadel", quickAmount: 45_000 },
  ];
  bill.quickSubtotal = 76_000;
  bill.discount = 22_600;
  bill.tax = { kind: "percent", value: 1_000 };
  bill.service = { kind: "percent", value: 500 };
  bill.payerId = "b";
  return bill;
}

describe("calculation engine", () => {
  it("uses largest remainder with stable participant order", () => {
    expect(allocate(10_000, [1, 1, 1])).toEqual([3_334, 3_333, 3_333]);
    expect(allocate(2, [1, 1, 1])).toEqual([1, 1, 0]);
  });

  it("calculates discount, percentage charges, and settlement exactly", () => {
    const result = calculateBill(validQuickBill());
    expect(result.canProceed).toBe(true);
    expect(result.total).toBe(61_410);
    expect(result.people.map((person) => person.total)).toEqual([25_049, 36_361]);
    expect(result.settlements).toMatchObject([{ fromName: "Malik", toName: "Fadel", amount: 25_049 }]);
    expect(result.people.reduce((sum, person) => sum + person.total, 0)).toBe(result.total);
  });

  it("splits shared items and quantity at line level", () => {
    const bill = validQuickBill();
    bill.mode = "itemized";
    bill.participants.push({ id: "c", name: "Adit", quickAmount: 0 });
    bill.items = [{ id: "fries", name: "Fries", unitPrice: 5_000, quantity: 2, participantIds: ["c", "a", "b"] }];
    bill.discount = 0;
    bill.tax.value = 0;
    bill.service.value = 0;
    const result = calculateBill(bill);
    expect(result.canProceed).toBe(true);
    expect(result.people.map((person) => person.total)).toEqual([3_334, 3_333, 3_333]);
  });

  it("uses gross proportions for fixed charges after full discount", () => {
    const bill = validQuickBill();
    bill.quickSubtotal = 1_000;
    bill.participants[0].quickAmount = 600;
    bill.participants[1].quickAmount = 400;
    bill.discount = 1_000;
    bill.tax = { kind: "amount", value: 300 };
    bill.service = { kind: "amount", value: 200 };
    const result = calculateBill(bill);
    expect(result.canProceed).toBe(true);
    expect(result.people.map((person) => person.total)).toEqual([300, 200]);
    expect(result.total).toBe(500);
  });

  it("rounds each percentage once on the discounted subtotal", () => {
    const bill = validQuickBill();
    bill.quickSubtotal = 1;
    bill.participants[0].quickAmount = 1;
    bill.participants[1].quickAmount = 0;
    bill.discount = 0;
    bill.tax = { kind: "percent", value: 5_000 };
    bill.service = { kind: "percent", value: 5_000 };
    const result = calculateBill(bill);
    expect(result.canProceed).toBe(true);
    expect(result.tax).toBe(1);
    expect(result.service).toBe(1);
    expect(result.total).toBe(3);
  });

  it("blocks mismatched bills and invalid owners", () => {
    const bill = validQuickBill();
    bill.participants[0].quickAmount -= 1;
    expect(calculateBill(bill).errors.some((error) => error.field === "quick-check")).toBe(true);
    bill.participants[0].quickAmount += 1;
    bill.expectedTotal = 61_411;
    expect(calculateBill(bill).checks.totalDifference).toBe(-1);
    bill.mode = "itemized";
    bill.expectedTotal = null;
    bill.items = [{ id: "x", name: "Item", unitPrice: 10_000, quantity: 1, participantIds: [] }];
    expect(calculateBill(bill).canProceed).toBe(false);
  });

  it("rejects discounts above subtotal and duplicate names", () => {
    const bill = validQuickBill();
    bill.discount = 76_001;
    bill.participants[1].name = "malik";
    const result = calculateBill(bill);
    expect(result.errors.map((error) => error.field)).toEqual(expect.arrayContaining(["discount", "participants"]));
  });

  it("preserves the balance invariant across many uneven allocations", () => {
    for (let base = 1; base <= 100; base += 1) {
      const bill = validQuickBill();
      bill.participants[0].quickAmount = base * 37 + 1;
      bill.participants[1].quickAmount = base * 13 + 2;
      bill.quickSubtotal = bill.participants[0].quickAmount + bill.participants[1].quickAmount;
      bill.discount = base % bill.quickSubtotal;
      bill.tax = { kind: "percent", value: 1_234 };
      bill.service = { kind: "amount", value: base * 3 + 1 };
      const result = calculateBill(bill);
      expect(result.canProceed).toBe(true);
      expect(result.people.reduce((sum, person) => sum + person.total, 0)).toBe(result.total);
      expect(result.settlements.reduce((sum, transfer) => sum + transfer.amount, 0)).toBe(result.total - result.people[1].total);
    }
  });
});
