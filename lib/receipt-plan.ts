import type { BillCalculation, BillDraft, PersonBreakdown } from "./bill";
import { formatRupiah } from "./format";

export const FULL_FIRST_TOP = 626;
export const FULL_CONTINUATION_TOP = 424;
export const FULL_CONTENT_BOTTOM = 1155;
export const FULL_SECTION_HEADER = 54;
export const FULL_LINE_HEIGHT = 45;
export const FULL_SECTION_SUMMARY = 94;
export const FULL_SECTION_CONTINUED = 20;
export const FULL_SECTION_GAP = 18;

export type ReceiptLine = { name: string; formula: string; amount: number };
export type FullReceiptSection = {
  personIndex: number;
  start: number;
  end: number;
  top: number;
  height: number;
  continued: boolean;
  showSummary: boolean;
};
export type FullReceiptPage = { sections: FullReceiptSection[] };

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

export function fullSectionHeight(lineCount: number, showSummary: boolean): number {
  return FULL_SECTION_HEADER + lineCount * FULL_LINE_HEIGHT + (showSummary ? FULL_SECTION_SUMMARY : FULL_SECTION_CONTINUED) + FULL_SECTION_GAP;
}

export function planFullReceipt(bill: BillDraft, result: BillCalculation): FullReceiptPage[] {
  const pages: FullReceiptPage[] = [{ sections: [] }];
  let top = FULL_FIRST_TOP;

  result.people.forEach((person, personIndex) => {
    const totalLines = receiptLines(bill, person).length;
    let start = 0;

    while (start < totalLines) {
      const currentPage = pages[pages.length - 1];
      const remaining = totalLines - start;
      const available = FULL_CONTENT_BOTTOM - top;
      const finalHeight = fullSectionHeight(remaining, true);

      if (finalHeight <= available) {
        currentPage.sections.push({ personIndex, start, end: totalLines, top, height: finalHeight, continued: start > 0, showSummary: true });
        top += finalHeight;
        start = totalLines;
        continue;
      }

      const maxPartialLines = Math.floor((available - fullSectionHeight(0, false)) / FULL_LINE_HEIGHT);
      const take = Math.min(maxPartialLines, remaining - 1);
      if (take >= 1) {
        const height = fullSectionHeight(take, false);
        currentPage.sections.push({ personIndex, start, end: start + take, top, height, continued: start > 0, showSummary: false });
        start += take;
      }

      pages.push({ sections: [] });
      top = FULL_CONTINUATION_TOP;
    }
  });

  return pages;
}
