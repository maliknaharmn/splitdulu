import type { BillCalculation, BillDraft, PersonBreakdown } from "./bill";
import { formatRupiah } from "./format";

export const FULL_FIRST_TOP = 626;
export const RECEIPT_MIN_HEIGHT = 1350;
export const RECEIPT_FOOTER_SPACE = 195;
export const FULL_SECTION_HEADER = 54;
export const FULL_LINE_HEIGHT = 45;
export const FULL_SECTION_SUMMARY = 94;
export const FULL_SECTION_GAP = 18;
export const PERSONAL_FIRST_BASELINE = 670;
export const PERSONAL_LINE_HEIGHT = 38;

export type ReceiptLine = { name: string; formula: string; amount: number };
export type FullReceiptSection = {
  personIndex: number;
  top: number;
  height: number;
};
export type FullReceiptPlan = { sections: FullReceiptSection[]; height: number };

export function receiptLines(bill: BillDraft, person: PersonBreakdown): ReceiptLine[] {
  if (bill.mode === "quick") return [{ name: "Bagian awal", formula: "Nominal dasar sebelum biaya", amount: person.gross }];
  if (person.itemShares.length === 0) return [{ name: "Belum ada pesanan", formula: "Tidak ada item untuk orang ini", amount: 0 }];

  return person.itemShares.map((share) => {
    const item = bill.items.find((entry) => entry.id === share.itemId);
    const ownerCount = item?.participantIds.length ?? 1;
    const formula = item
      ? `${share.quantity} × ${formatRupiah(item.unitPrice)}${ownerCount > 1 ? ` ÷ ${ownerCount} orang` : ""}`
      : `Qty ${share.quantity}`;
    return { name: share.name, formula, amount: share.amount };
  });
}

export function fullSectionHeight(lineCount: number): number {
  return FULL_SECTION_HEADER + lineCount * FULL_LINE_HEIGHT + FULL_SECTION_SUMMARY + FULL_SECTION_GAP;
}

export function planFullReceipt(bill: BillDraft, result: BillCalculation): FullReceiptPlan {
  let top = FULL_FIRST_TOP;
  const sections = result.people.map((person, personIndex) => {
    const height = fullSectionHeight(receiptLines(bill, person).length);
    const section = { personIndex, top, height };
    top += height;
    return section;
  });

  return { sections, height: Math.max(RECEIPT_MIN_HEIGHT, top + RECEIPT_FOOTER_SPACE) };
}

export function planPersonalReceipt(bill: BillDraft, person: PersonBreakdown) {
  const lineCount = bill.mode === "quick" ? 1 : person.itemShares.length;
  const summaryTop = Math.max(1035, PERSONAL_FIRST_BASELINE + Math.max(0, lineCount - 1) * PERSONAL_LINE_HEIGHT + 40);
  return { summaryTop, height: summaryTop + 315 };
}
