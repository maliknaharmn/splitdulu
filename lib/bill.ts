export const MAX_PARTICIPANTS = 12;
export const MAX_ITEMS = 20;
export const MAX_MONEY = 1_000_000_000;
export const MAX_SUBTOTAL = 1_000_000_000_000;

export type BillMode = "quick" | "itemized";
export type Charge = { kind: "percent" | "amount"; value: number };
export type Participant = { id: string; name: string; quickAmount: number };
export type BillItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  participantIds: string[];
};
export type BillDraft = {
  id: string;
  title: string;
  mode: BillMode;
  participants: Participant[];
  quickSubtotal: number;
  items: BillItem[];
  discount: number;
  tax: Charge;
  service: Charge;
  payerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ValidationError = { field: string; message: string };
export type ItemShare = { itemId: string; name: string; quantity: number; amount: number };
export type PersonBreakdown = {
  id: string;
  name: string;
  gross: number;
  discount: number;
  tax: number;
  service: number;
  total: number;
  itemShares: ItemShare[];
};
export type Settlement = { fromId: string; fromName: string; toId: string; toName: string; amount: number };
export type BillCalculation = {
  subtotal: number;
  discount: number;
  tax: number;
  service: number;
  total: number;
  people: PersonBreakdown[];
  settlements: Settlement[];
  checks: { quickDifference: number | null };
  errors: ValidationError[];
  canProceed: boolean;
};

export function createBlankBill(id = "draft"): BillDraft {
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    mode: "quick",
    participants: [
      { id: "person-1", name: "", quickAmount: 0 },
      { id: "person-2", name: "", quickAmount: 0 },
    ],
    quickSubtotal: 0,
    items: [],
    discount: 0,
    tax: { kind: "percent", value: 0 },
    service: { kind: "percent", value: 0 },
    payerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function billTitle(bill: BillDraft): string {
  return bill.title.trim() || "Bill bareng";
}

function isMoney(value: number, max = MAX_MONEY): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= max;
}

export function allocate(total: number, weights: number[]): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || weights.some((weight) => !Number.isSafeInteger(weight) || weight < 0)) {
    throw new Error("Alokasi membutuhkan bilangan bulat tidak negatif.");
  }
  if (weights.length === 0) return [];
  if (total === 0) return weights.map(() => 0);

  const sum = weights.reduce((current, weight) => current + BigInt(weight), BigInt(0));
  if (sum === BigInt(0)) throw new Error("Bobot alokasi tidak boleh semuanya nol.");

  const pieces = weights.map((weight, index) => {
    const numerator = BigInt(total) * BigInt(weight);
    return { index, amount: Number(numerator / sum), remainder: numerator % sum };
  });
  const allocated = pieces.reduce((current, piece) => current + piece.amount, 0);
  pieces.sort((first, second) => {
    if (first.remainder === second.remainder) return first.index - second.index;
    return first.remainder > second.remainder ? -1 : 1;
  });
  for (let remainder = total - allocated, index = 0; remainder > 0; remainder -= 1, index += 1) {
    pieces[index].amount += 1;
  }
  return pieces.sort((first, second) => first.index - second.index).map((piece) => piece.amount);
}

function roundHalfUpRatio(amount: number, basisPoints: number): number {
  return Number((BigInt(amount) * BigInt(basisPoints) + BigInt(5_000)) / BigInt(10_000));
}

export function calculateBill(bill: BillDraft): BillCalculation {
  const errors: ValidationError[] = [];
  const addError = (field: string, message: string) => errors.push({ field, message });

  if (bill.participants.length < 2 || bill.participants.length > MAX_PARTICIPANTS) {
    addError("participants", `Perlu 2–${MAX_PARTICIPANTS} orang.`);
  }
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const participant of bill.participants) {
    const name = participant.name.trim();
    if (!name) addError("participants", "Isi nama semua orang.");
    if (name.length > 32) addError("participants", "Nama maksimal 32 karakter.");
    if (name && names.has(name.toLocaleLowerCase("id-ID"))) addError("participants", "Nama orang harus berbeda.");
    names.add(name.toLocaleLowerCase("id-ID"));
    if (ids.has(participant.id)) addError("participants", "Data orang tidak valid.");
    ids.add(participant.id);
    if (!isMoney(participant.quickAmount)) addError("quick", "Bagian orang harus berupa rupiah bulat yang valid.");
  }

  const people: PersonBreakdown[] = bill.participants.map((participant) => ({
    id: participant.id,
    name: participant.name.trim(),
    gross: 0,
    discount: 0,
    tax: 0,
    service: 0,
    total: 0,
    itemShares: [],
  }));

  let subtotal = 0;
  let quickDifference: number | null = null;

  if (bill.mode === "quick") {
    if (!isMoney(bill.quickSubtotal, MAX_SUBTOTAL) || bill.quickSubtotal === 0) {
      addError("quick", "Isi subtotal positif yang valid.");
    }
    subtotal = isMoney(bill.quickSubtotal, MAX_SUBTOTAL) ? bill.quickSubtotal : 0;
    for (let index = 0; index < people.length; index += 1) {
      people[index].gross = isMoney(bill.participants[index].quickAmount) ? bill.participants[index].quickAmount : 0;
    }
    const sumOfShares = people.reduce((current, person) => current + person.gross, 0);
    quickDifference = sumOfShares - subtotal;
    if (quickDifference !== 0) addError("quick-check", "Jumlah bagian orang belum sama dengan subtotal.");
  } else if (bill.mode === "itemized") {
    if (bill.items.length < 1 || bill.items.length > MAX_ITEMS) addError("items", `Perlu 1–${MAX_ITEMS} item.`);
    for (const item of bill.items) {
      if (!item.name.trim() || item.name.trim().length > 60) addError("items", "Isi nama item (maksimal 60 karakter).");
      if (!isMoney(item.unitPrice)) addError("items", "Harga item harus berupa rupiah bulat yang valid.");
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        addError("items", "Qty item harus 1–99.");
      }
      const owners = bill.participants.filter((participant) => item.participantIds.includes(participant.id));
      if (owners.length === 0 || new Set(item.participantIds).size !== item.participantIds.length || owners.length !== item.participantIds.length) {
        addError("items", "Pilih minimal satu orang aktif untuk setiap item.");
      }
      if (!isMoney(item.unitPrice) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || owners.length === 0) continue;
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      const ownerWeights = people.map((person) => item.participantIds.includes(person.id) ? 1 : 0);
      const shares = allocate(lineTotal, ownerWeights);
      for (let index = 0; index < people.length; index += 1) {
        if (!ownerWeights[index]) continue;
        people[index].gross += shares[index];
        people[index].itemShares.push({ itemId: item.id, name: item.name.trim(), quantity: item.quantity, amount: shares[index] });
      }
    }
    if (subtotal === 0) addError("items", "Subtotal item harus lebih dari Rp0.");
    if (subtotal > MAX_SUBTOTAL) addError("items", "Subtotal terlalu besar.");
  } else {
    addError("mode", "Mode split tidak valid.");
  }

  if (!isMoney(bill.discount)) addError("discount", "Diskon harus berupa rupiah bulat yang valid.");
  if (bill.discount > subtotal) addError("discount", "Diskon tidak boleh melebihi subtotal.");
  const discount = isMoney(bill.discount) && bill.discount <= subtotal ? bill.discount : 0;
  const grossWeights = people.map((person) => person.gross);
  if (subtotal > 0 && grossWeights.some((weight) => weight > 0)) {
    const allocations = allocate(discount, grossWeights);
    people.forEach((person, index) => { person.discount = allocations[index]; });
  }
  const discountedSubtotal = subtotal - discount;
  const netWeights = people.map((person) => person.gross - person.discount);
  const chargeWeights = netWeights.some((weight) => weight > 0) ? netWeights : grossWeights;

  function getCharge(charge: Charge, field: string): number {
    if (charge.kind === "percent") {
      if (!Number.isSafeInteger(charge.value) || charge.value < 0 || charge.value > 10_000) {
        addError(field, `${field === "tax" ? "Pajak" : "Service"} persen harus 0–100%.`);
        return 0;
      }
      return roundHalfUpRatio(discountedSubtotal, charge.value);
    }
    if (charge.kind === "amount") {
      if (!isMoney(charge.value)) {
        addError(field, `${field === "tax" ? "Pajak" : "Service"} nominal tidak valid.`);
        return 0;
      }
      return charge.value;
    }
    addError(field, "Jenis biaya tidak valid.");
    return 0;
  }

  const tax = getCharge(bill.tax, "tax");
  const service = getCharge(bill.service, "service");
  if ((tax > 0 || service > 0) && chargeWeights.every((weight) => weight === 0)) {
    addError("charges", "Biaya belum dapat dibagi tanpa subtotal.");
  } else if (chargeWeights.some((weight) => weight > 0)) {
    const taxAllocations = allocate(tax, chargeWeights);
    const serviceAllocations = allocate(service, chargeWeights);
    people.forEach((person, index) => {
      person.tax = taxAllocations[index];
      person.service = serviceAllocations[index];
    });
  }

  const total = discountedSubtotal + tax + service;
  if (!Number.isSafeInteger(total) || total > MAX_SUBTOTAL + MAX_MONEY * 2) addError("total", "Total tagihan terlalu besar.");
  people.forEach((person) => { person.total = person.gross - person.discount + person.tax + person.service; });

  const payer = people.find((person) => person.id === bill.payerId);
  if (!payer) addError("payer", "Pilih orang yang bayar dulu.");
  const settlements: Settlement[] = payer
    ? people.filter((person) => person.id !== payer.id && person.total > 0).map((person) => ({
      fromId: person.id,
      fromName: person.name,
      toId: payer.id,
      toName: payer.name,
      amount: person.total,
    }))
    : [];

  if (errors.length === 0) {
    if (people.reduce((current, person) => current + person.total, 0) !== total) addError("total", "Pembagian tidak seimbang.");
    if (payer && settlements.reduce((current, settlement) => current + settlement.amount, 0) !== total - payer.total) {
      addError("payer", "Jumlah transfer tidak seimbang.");
    }
  }

  return {
    subtotal,
    discount,
    tax,
    service,
    total,
    people,
    settlements,
    checks: { quickDifference },
    errors,
    canProceed: errors.length === 0,
  };
}
