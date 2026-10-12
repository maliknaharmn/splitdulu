import { describe, expect, it } from "vitest";

import { calculateBill, createBlankBill } from "./bill";
import { FULL_CONTENT_BOTTOM, planFullReceipt, receiptLines } from "./receipt-plan";

describe("full receipt pagination", () => {
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
    const pages = planFullReceipt(bill, result);

    expect(result.canProceed).toBe(true);
    expect(pages).toHaveLength(1);
    expect(pages[0].sections).toHaveLength(2);
    expect(pages[0].sections.every((section) => section.showSummary)).toBe(true);
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
    const pages = planFullReceipt(bill, result);

    expect(result.canProceed).toBe(true);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.sections.length > 0)).toBe(true);
    expect(pages.flatMap((page) => page.sections).every((section) => section.top + section.height <= FULL_CONTENT_BOTTOM)).toBe(true);

    for (const personIndex of result.people.keys()) {
      const sections = pages.flatMap((page) => page.sections).filter((section) => section.personIndex === personIndex);
      expect(sections.reduce((count, section) => count + section.end - section.start, 0)).toBe(20);
      expect(sections.filter((section) => section.showSummary)).toHaveLength(1);
      expect(sections[0].start).toBe(0);
      expect(sections.at(-1)?.end).toBe(20);
      for (let index = 1; index < sections.length; index += 1) expect(sections[index].start).toBe(sections[index - 1].end);
    }
  });
});
