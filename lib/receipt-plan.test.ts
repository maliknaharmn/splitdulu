import { describe, expect, it } from "vitest";

import { calculateBill, createBlankBill } from "./bill";
import { FULL_FIRST_TOP, PERSONAL_FIRST_BASELINE, PERSONAL_LINE_HEIGHT, RECEIPT_FOOTER_SPACE, fullSectionHeight, planFullReceipt, planPersonalReceipt, receiptLines } from "./receipt-plan";

describe("single-image receipt layout", () => {
  it("keeps two small itemized breakdowns on one image", () => {
    const bill = createBlankBill("small");
    bill.mode = "itemized";
    bill.participants[0].name = "Malik";
    bill.participants[1].name = "Fadel";
    bill.items = [
      { id: "one", name: "Ayam", unitPrice: 20_000, quantity: 1, participantIds: ["person-1", "person-2"] },
      { id: "two", name: "Fries", unitPrice: 15_000, quantity: 2, participantIds: ["person-1", "person-2"] },
    ];
    bill.payerId = "person-1";
    const result = calculateBill(bill);
    const plan = planFullReceipt(bill, result);

    expect(result.canProceed).toBe(true);
    expect(plan.height).toBe(1350);
    expect(plan.sections).toHaveLength(2);
    expect(plan.sections[0].top).toBe(FULL_FIRST_TOP);
    expect(plan.sections[1].top).toBe(FULL_FIRST_TOP + fullSectionHeight(2));
    expect(receiptLines(bill, result.people[0])[1]).toEqual({ name: "Fries", formula: "2 × Rp15.000 ÷ 2 orang", amount: 15_000 });
  });

  it("includes every menu line and exactly one calculation summary per person at the maximum bill size", () => {
    const bill = createBlankBill("large");
    bill.mode = "itemized";
    bill.participants = Array.from({ length: 12 }, (_, index) => ({ id: `person-${index}`, name: `Orang ${index + 1}`, quickAmount: 0 }));
    bill.items = Array.from({ length: 20 }, (_, index) => ({
      id: `item-${index}`,
      name: `Menu ${index + 1}`,
      unitPrice: 10_000,
      quantity: 2,
      participantIds: bill.participants.map((person) => person.id),
    }));
    bill.discount = 30_000;
    bill.tax = { kind: "percent", value: 1_000 };
    bill.service = { kind: "percent", value: 500 };
    bill.payerId = "person-0";
    const result = calculateBill(bill);
    const plan = planFullReceipt(bill, result);

    expect(result.canProceed).toBe(true);
    expect(plan.height).toBeGreaterThan(1350);
    expect(plan.sections).toHaveLength(12);
    expect(plan.sections.every((section) => section.top + section.height <= plan.height - RECEIPT_FOOTER_SPACE)).toBe(true);

    for (const personIndex of result.people.keys()) {
      const section = plan.sections[personIndex];
      expect(section.personIndex).toBe(personIndex);
      expect(section.height).toBe(fullSectionHeight(20));
      if (personIndex > 0) expect(section.top).toBe(plan.sections[personIndex - 1].top + plan.sections[personIndex - 1].height);
    }
    expect(plan.height).toBe(FULL_FIRST_TOP + 12 * fullSectionHeight(20) + RECEIPT_FOOTER_SPACE);
  });

  it("extends personal receipts rather than squeezing items into columns", () => {
    const bill = createBlankBill("personal");
    bill.mode = "itemized";
    bill.items = Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, name: `Menu ${index + 1}`, unitPrice: 10_000, quantity: 1, participantIds: ["person-1"] }));
    const person = calculateBill(bill).people[0];
    const plan = planPersonalReceipt(bill, person);
    const lastItemBaseline = PERSONAL_FIRST_BASELINE + 19 * PERSONAL_LINE_HEIGHT;
    expect(plan.summaryTop).toBeGreaterThan(lastItemBaseline);
    expect(plan.height).toBeGreaterThan(1350);
    expect(plan.summaryTop + 110).toBeLessThan(plan.height - 177);
  });

  it("keeps quick receipts at least the original size and handles people without items", () => {
    const bill = createBlankBill("quick");
    const person = calculateBill(bill).people[0];
    expect(planPersonalReceipt(bill, person).height).toBe(1350);
    expect(planFullReceipt(bill, calculateBill(bill)).height).toBe(1350);
    bill.mode = "itemized";
    expect(receiptLines(bill, person)).toEqual([{ name: "Belum ada pesanan", formula: "Tidak ada item untuk orang ini", amount: 0 }]);
    expect(planPersonalReceipt(bill, person).height).toBe(1350);
  });
});
