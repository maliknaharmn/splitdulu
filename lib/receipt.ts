import { billTitle, type BillCalculation, type BillDraft, type PersonBreakdown } from "./bill";
import { formatDate, formatRupiah } from "./format";
import { FULL_CONTENT_BOTTOM, FULL_LINE_HEIGHT, FULL_SECTION_HEADER, planFullReceipt, receiptLines, type FullReceiptPage, type FullReceiptSection } from "./receipt-plan";
import { bundlePngs } from "./zip";

export const RECEIPT_WIDTH = 1080;
export const RECEIPT_HEIGHT = 1350;
export type ReceiptSelection = "full" | string;

const ink = "#171B16";
const muted = "#687064";
const lime = "#C8F269";

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function line(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.strokeStyle = "#DFE5D9";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.stroke();
}

function font(context: CanvasRenderingContext2D, size: number, weight: number) {
  context.font = `${weight} ${size}px Montserrat`;
}

function clippedText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  if (context.measureText(value).width <= maxWidth) return value;
  let end = value.length;
  while (end > 0 && context.measureText(`${value.slice(0, end)}…`).width > maxWidth) end -= 1;
  return `${value.slice(0, end)}…`;
}

function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, weight: number, color = ink, maxWidth?: number, align: CanvasTextAlign = "left") {
  font(context, size, weight);
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = "alphabetic";
  context.fillText(maxWidth ? clippedText(context, value, maxWidth) : value, x, y);
}

function fittedText(context: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, initialSize = 82) {
  let size = initialSize;
  font(context, size, 800);
  while (size > 43 && context.measureText(value).width > maxWidth) {
    size -= 2;
    font(context, size, 800);
  }
  text(context, value, x, y, size, 800);
}

function drawBrand(context: CanvasRenderingContext2D) {
  const path = new Path2D("M49 1h44c17 0 26 9 26 23 0 15-9 23-25 23H59c-11 0-16-5-16-13 0-9-5-14-13-14-9 0-15 8-15 18 0 14 13 21 37 28l25 7c28 8 43 21 43 43 0 22-19 34-47 34H25C9 150 0 142 0 128c0-14 9-23 24-23h37c-1 17 5 26 16 26 10 0 16-7 16-16 0-10-8-16-25-21l-27-8C13 78 0 63 0 43 0 18 21 1 49 1Z");
  context.save();
  context.translate(142, 145);
  context.scale(0.31, 0.31);
  context.fillStyle = "#B8E944";
  context.fill(path);
  context.restore();
  text(context, "Split", 191, 184, 32, 700);
  const splitWidth = context.measureText("Split").width;
  text(context, "Dulu", 191 + splitWidth, 184, 32, 800);
  text(context, "SPLIT RECEIPT", 937, 184, 17, 800, "#8A9586", undefined, "right");
  line(context, 142, 230, 796);
}

function drawBase(context: CanvasRenderingContext2D, bill: BillDraft) {
  context.fillStyle = "#F4F5EE";
  context.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT);
  context.beginPath();
  context.arc(970, 100, 226, 0, Math.PI * 2);
  context.fillStyle = lime;
  context.fill();
  context.beginPath();
  context.arc(65, 1252, 182, 0, Math.PI * 2);
  context.fillStyle = "#EBE7F7";
  context.fill();
  roundedRect(context, 80, 84, 920, 1180, 46, "#FFFFFF");
  drawBrand(context);
  text(context, billTitle(bill), 142, 300, 48, 800, ink, 796);
  text(context, formatDate(bill.updatedAt), 142, 339, 20, 500, muted);
}

function drawWatermark(context: CanvasRenderingContext2D, pageNumber = 1, pageCount = 1) {
  line(context, 142, 1173, 796);
  text(context, "dibuat dengan SplitDulu", 142, 1201, 19, 700, "#7F897B");
  if (pageCount > 1) {
    text(context, `${String(pageNumber).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`, 938, 1201, 18, 800, muted, undefined, "right");
    return;
  }
  context.beginPath();
  context.arc(922, 1194, 11, 0, Math.PI * 2);
  context.fillStyle = lime;
  context.fill();
}

function drawFullSection(context: CanvasRenderingContext2D, bill: BillDraft, result: BillCalculation, section: FullReceiptSection) {
  const person = result.people[section.personIndex];
  const entries = receiptLines(bill, person).slice(section.start, section.end);
  const { top } = section;
  roundedRect(context, 142, top, 796, 48, 15, "#EAF7D2");
  const amount = formatRupiah(person.total);
  font(context, 23, 800);
  const amountWidth = context.measureText(amount).width;
  text(context, `${String(section.personIndex + 1).padStart(2, "0")}   ${person.name}${section.continued ? " (lanjutan)" : ""}`, 162, top + 31, 22, 800, ink, Math.max(120, 748 - amountWidth - 20));
  text(context, amount, 918, top + 31, 23, 800, ink, undefined, "right");

  entries.forEach((entry, index) => {
    const rowTop = top + FULL_SECTION_HEADER + index * FULL_LINE_HEIGHT;
    const rowAmount = formatRupiah(entry.amount);
    font(context, 20, 800);
    const availableTextWidth = Math.max(160, 796 - context.measureText(rowAmount).width - 30);
    text(context, entry.name, 152, rowTop + 20, 20, 700, ink, availableTextWidth);
    text(context, entry.formula, 152, rowTop + 39, 16, 500, muted, availableTextWidth);
    text(context, rowAmount, 938, rowTop + 28, 20, 800, ink, undefined, "right");
  });

  const summaryTop = top + FULL_SECTION_HEADER + entries.length * FULL_LINE_HEIGHT;
  if (!section.showSummary) {
    text(context, "Bersambung di halaman berikutnya", 152, summaryTop + 15, 16, 600, muted);
    return;
  }

  line(context, 142, summaryTop + 4, 796);
  const summaryRows = [
    [["Subtotal", person.gross], ["Diskon", -person.discount]],
    [["Pajak", person.tax], ["Service", person.service]],
  ] as const;
  summaryRows.forEach((row, rowIndex) => {
    const y = summaryTop + 32 + rowIndex * 30;
    row.forEach(([label, value], columnIndex) => {
      const left = columnIndex === 0 ? 152 : 548;
      const right = columnIndex === 0 ? 519 : 938;
      text(context, label, left, y, 18, 600, muted);
      text(context, `${value < 0 ? "−" : ""}${formatRupiah(Math.abs(value))}`, right, y, 18, 700, ink, undefined, "right");
    });
  });
}

function drawFull(context: CanvasRenderingContext2D, bill: BillDraft, result: BillCalculation, page: FullReceiptPage, pageIndex: number, pageCount: number) {
  let verticalOffset = 0;
  if (pageIndex === 0) {
    text(context, "TOTAL TAGIHAN", 142, 406, 20, 800, muted);
    fittedText(context, formatRupiah(result.total), 142, 490, 796);
    const payer = result.people.find((person) => person.id === bill.payerId);
    if (payer) {
      roundedRect(context, 142, 521, 796, 56, 18, "#EAF7D2");
      text(context, `Dibayar dulu oleh ${payer.name}`, 166, 557, 22, 700, "#385D1B", 744);
    }
    text(context, "RINCIAN PER ORANG", 142, 610, 19, 800, muted);
  } else {
    const lastSection = page.sections[page.sections.length - 1];
    verticalOffset = Math.max(0, Math.floor((FULL_CONTENT_BOTTOM - lastSection.top - lastSection.height) / 2));
    text(context, "RINCIAN PER ORANG · LANJUTAN", 142, 398 + verticalOffset, 19, 800, muted);
  }
  page.sections.forEach((section) => drawFullSection(context, bill, result, { ...section, top: section.top + verticalOffset }));
  drawWatermark(context, pageIndex + 1, pageCount);
}

function drawItemRow(context: CanvasRenderingContext2D, name: string, amount: number, x: number, y: number, width: number, compact: boolean) {
  const size = compact ? 19 : 23;
  const amountText = formatRupiah(amount);
  font(context, size, 700);
  const amountWidth = context.measureText(amountText).width;
  text(context, name, x, y, size, 600, ink, Math.max(60, width - amountWidth - 24));
  text(context, amountText, x + width, y, size, 700, ink, undefined, "right");
}

function drawPersonal(context: CanvasRenderingContext2D, person: PersonBreakdown, mode: BillDraft["mode"]) {
  text(context, "BAGIAN UNTUK", 142, 407, 20, 800, muted);
  text(context, person.name, 142, 458, 48, 800, ink, 796);
  fittedText(context, formatRupiah(person.total), 142, 542, 796, 78);
  line(context, 142, 584, 796);
  text(context, mode === "quick" ? "NOMINAL DASAR" : "PESANANMU", 142, 628, 19, 800, muted);

  const entries = mode === "quick"
    ? [{ name: "Bagian awal", quantity: 1, amount: person.gross }]
    : person.itemShares;
  const compact = entries.length > 10;
  entries.forEach((entry, index) => {
    const column = compact && index >= 10 ? 1 : 0;
    const row = compact ? index % 10 : index;
    const x = column === 0 ? 142 : 558;
    const width = compact ? 376 : 796;
    const name = `${entry.name}${entry.quantity > 1 ? ` ×${entry.quantity}` : ""}`;
    drawItemRow(context, name, entry.amount, x, 670 + row * (compact ? 38 : 38), width, compact);
  });

  line(context, 142, 1035, 796);
  const rows = [
    ["Subtotal", person.gross],
    ["Diskon", -person.discount],
    ["Pajak", person.tax],
    ["Service", person.service],
  ] as const;
  rows.forEach(([label, value], index) => {
    const y = 1064 + index * 27;
    text(context, label, 142, y, 20, 600, muted);
    text(context, `${value < 0 ? "−" : ""}${formatRupiah(Math.abs(value))}`, 938, y, 20, 700, ink, undefined, "right");
  });
  drawWatermark(context);
}

export async function renderReceiptPages(bill: BillDraft, result: BillCalculation, selection: ReceiptSelection): Promise<Blob[]> {
  if (!result.canProceed) throw new Error("Bill belum siap untuk dibagikan.");
  const person = selection === "full" ? null : result.people.find((entry) => entry.id === selection);
  if (selection !== "full" && !person) throw new Error("Orang untuk struk tidak ditemukan.");
  await Promise.all([
    document.fonts.load("500 32px Montserrat"),
    document.fonts.load("700 32px Montserrat"),
    document.fonts.load("800 82px Montserrat"),
  ]);
  const pages = person ? [null] : planFullReceipt(bill, result);
  const blobs: Blob[] = [];
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const canvas = document.createElement("canvas");
    canvas.width = RECEIPT_WIDTH;
    canvas.height = RECEIPT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak dapat membuat gambar struk.");
    drawBase(context, bill);
    if (person) drawPersonal(context, person, bill.mode);
    else if (page) drawFull(context, bill, result, page, index, pages.length);
    blobs.push(await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Gambar PNG tidak berhasil dibuat.")), "image/png");
    }));
  }
  return blobs;
}

export function receiptFileName(bill: BillDraft, result: BillCalculation, selection: ReceiptSelection, pageNumber?: number): string {
  const name = selection === "full" ? billTitle(bill) : result.people.find((person) => person.id === selection)?.name || "personal";
  const slug = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "bill";
  return `splitdulu-${slug}${pageNumber ? `-halaman-${pageNumber}` : ""}.png`;
}

export function downloadReceipt(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function downloadReceiptPages(blobs: Blob[], fileNames: string[], archiveName: string) {
  if (blobs.length === 1) {
    downloadReceipt(blobs[0], fileNames[0]);
    return;
  }
  const archive = await bundlePngs(blobs.map((blob, index) => ({ name: fileNames[index], blob })));
  downloadReceipt(archive, archiveName);
}

export async function shareReceiptPages(blobs: Blob[], fileNames: string[], archiveName: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const files = blobs.map((blob, index) => new File([blob], fileNames[index], { type: "image/png" }));
  let canShare = false;
  try {
    canShare = typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files });
  } catch {
    canShare = false;
  }
  if (canShare) {
    try {
      await navigator.share({ files, title: "Struk SplitDulu" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  await downloadReceiptPages(blobs, fileNames, archiveName);
  return "downloaded";
}
