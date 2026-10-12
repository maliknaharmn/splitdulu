import { billTitle, type BillCalculation, type BillDraft } from "./bill";

const rupiahFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatRupiah(value: number): string {
  return `Rp${rupiahFormatter.format(value)}`;
}

export function formatInputMoney(value: number | null): string {
  return value === null ? "" : rupiahFormatter.format(value);
}

export function parseRupiahInput(raw: string): number | null {
  const cleaned = raw.trim().toLowerCase().replace(/^rp\s*/, "").replace(/\s/g, "");
  if (!cleaned) return null;
  const shorthand = cleaned.match(/^(\d+)(?:[.,](\d{1,3}))?k$/);
  if (shorthand) {
    const fraction = (shorthand[2] || "").padEnd(3, "0");
    const value = Number(shorthand[1]) * 1_000 + Number(fraction || 0);
    return Number.isSafeInteger(value) ? value : null;
  }
  if (!/^\d[\d.]*$/.test(cleaned)) return null;
  const value = Number(cleaned.replace(/\./g, ""));
  return Number.isSafeInteger(value) ? value : null;
}

export function parsePercentInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/%$/, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : null;
}

export function formatPercentInput(basisPoints: number): string {
  return (basisPoints / 100).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function buildWhatsAppText(bill: BillDraft, result: BillCalculation): string {
  const payer = result.people.find((person) => person.id === bill.payerId);
  return [
    `SplitDulu — ${billTitle(bill)}`,
    `Total: ${formatRupiah(result.total)}`,
    "",
    ...result.people.map((person) => `${person.name}: ${formatRupiah(person.total)}`),
    "",
    payer ? `Dibayar dulu oleh ${payer.name}.` : "",
    ...result.settlements.map((settlement) => `${settlement.fromName} → ${settlement.toName}: ${formatRupiah(settlement.amount)}`),
    "",
    "Dihitung dengan SplitDulu",
  ].filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== "")).join("\n").trim();
}
