import { calculateBill, MAX_ITEMS, MAX_MONEY, MAX_PARTICIPANTS, MAX_SUBTOTAL, type BillDraft, type Charge } from "./bill";

export const STORAGE_KEY = "splitdulu:v1";

type PersistedState = { version: 1; draft: BillDraft; recent: BillDraft[] };
type ReadResult = { draft: BillDraft | null; recent: BillDraft[]; error: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMoney(value: unknown, max = MAX_MONEY): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
}

function isCharge(value: unknown): value is Charge {
  return isRecord(value) && ((value.kind === "amount" && isMoney(value.value)) ||
    (value.kind === "percent" && isMoney(value.value, 10_000)));
}

export function isBillDraft(value: unknown): value is BillDraft {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id.length > 100 || typeof value.title !== "string" || value.title.length > 100) return false;
  if (value.mode !== "quick" && value.mode !== "itemized") return false;
  if (!Array.isArray(value.participants) || value.participants.length > MAX_PARTICIPANTS || !Array.isArray(value.items) || value.items.length > MAX_ITEMS) return false;
  if (!isMoney(value.quickSubtotal, MAX_SUBTOTAL) || !isMoney(value.discount) || !isCharge(value.tax) || !isCharge(value.service)) return false;
  if (value.expectedSubtotal !== null && !isMoney(value.expectedSubtotal, MAX_SUBTOTAL)) return false;
  if (value.expectedTotal !== null && !isMoney(value.expectedTotal, MAX_SUBTOTAL + 2 * MAX_MONEY)) return false;
  if (value.payerId !== null && (typeof value.payerId !== "string" || value.payerId.length > 100)) return false;
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.createdAt)) || Number.isNaN(Date.parse(value.updatedAt))) return false;
  const participantsValid = value.participants.every((participant) => isRecord(participant) &&
    typeof participant.id === "string" && participant.id.length <= 100 &&
    typeof participant.name === "string" && participant.name.length <= 60 && isMoney(participant.quickAmount));
  const itemsValid = value.items.every((item) => isRecord(item) &&
    typeof item.id === "string" && item.id.length <= 100 &&
    typeof item.name === "string" && item.name.length <= 100 &&
    isMoney(item.unitPrice) && isMoney(item.quantity, 99) &&
    Array.isArray(item.participantIds) && item.participantIds.length <= MAX_PARTICIPANTS &&
    item.participantIds.every((id: unknown) => typeof id === "string" && id.length <= 100));
  return participantsValid && itemsValid;
}

export function readPersistedState(): ReadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: null, recent: [], error: null };
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1) return { draft: null, recent: [], error: null };
    const recent = Array.isArray(value.recent)
      ? value.recent.filter((bill): bill is BillDraft => isBillDraft(bill) && calculateBill(bill).canProceed).slice(0, 5)
      : [];
    return { draft: isBillDraft(value.draft) ? value.draft : null, recent, error: null };
  } catch (error) {
    if (error instanceof SyntaxError) return { draft: null, recent: [], error: null };
    return { draft: null, recent: [], error: "Penyimpanan browser tidak tersedia. Bill tetap bisa dipakai selama tab ini terbuka." };
  }
}

export function writePersistedState(draft: BillDraft, recent: BillDraft[]): string | null {
  const value: PersistedState = { version: 1, draft, recent: recent.slice(0, 5) };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return null;
  } catch {
    return "Penyimpanan browser tidak tersedia. Bill tetap bisa dipakai selama tab ini terbuka.";
  }
}
