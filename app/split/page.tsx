"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Plus, Trash2, UsersRound } from "lucide-react";

import { MoneyInput, PercentInput } from "@/components/money-input";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateBill, MAX_ITEMS, MAX_PARTICIPANTS, type BillDraft, type BillItem, type Charge, type ValidationError } from "@/lib/bill";
import { formatRupiah } from "@/lib/format";
import { useBill } from "@/providers/bill-provider";

function SectionHeading({ number, title, description }: { number: string; title: string; description?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E9F6D0] text-xs font-extrabold text-[#52772C]">{number}</span>
      <div><h2 className="text-lg font-extrabold tracking-[-0.045em]">{title}</h2>{description && <p className="mt-1 text-xs leading-5 font-medium text-[#8A9586]">{description}</p>}</div>
    </div>
  );
}

function FieldErrors({ errors, fields }: { errors: ValidationError[]; fields: string[] }) {
  const messages = [...new Set(errors.filter((error) => fields.includes(error.field)).map((error) => error.message))];
  if (!messages.length) return null;
  return <div className="mt-3 space-y-1" role="alert">{messages.map((message) => <p key={message} className="flex items-start gap-1.5 text-xs font-semibold text-[#B13A30]"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{message}</p>)}</div>;
}

function ChargeField({ label, charge, onChange, id }: { label: string; charge: Charge; onChange: (charge: Charge) => void; id: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
        {charge.kind === "amount"
          ? <MoneyInput id={id} value={charge.value} onValueChange={(value) => onChange({ ...charge, value: value ?? 0 })} aria-label={`${label} nominal`} />
          : <PercentInput id={id} value={charge.value} onValueChange={(value) => onChange({ ...charge, value })} aria-label={`${label} persen`} />}
        <select
          aria-label={`Satuan ${label}`}
          value={charge.kind}
          onChange={(event) => onChange({ kind: event.target.value as Charge["kind"], value: 0 })}
          className="h-12 rounded-[14px] border border-[#DDE4D6] bg-white px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#98C23E]"
        >
          <option value="percent">%</option><option value="amount">Rp</option>
        </select>
      </div>
    </div>
  );
}

function Difference({ label, actual, expected, difference }: { label: string; actual: number; expected: number; difference: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E9DF] py-3 text-xs font-semibold">
      <span className="text-[#687064]">{label}</span>
      <div className="text-right"><span className="tabular-nums">{formatRupiah(actual)} / {formatRupiah(expected)}</span><span className={`ml-2 font-bold ${difference === 0 ? "text-[#4C8126]" : "text-[#B13A30]"}`}>{difference === 0 ? "Cocok" : `${difference < 0 ? "Kurang" : "Lebih"} ${formatRupiah(Math.abs(difference))}`}</span></div>
    </div>
  );
}

export default function SplitPage() {
  const router = useRouter();
  const { bill, hydrated, storageError, updateBill, saveCurrentToRecent } = useBill();
  const result = React.useMemo(() => calculateBill(bill), [bill]);
  const participantInputs = React.useRef(new Map<string, HTMLInputElement>());
  const pendingParticipantFocus = React.useRef<string | null>(null);
  const personLabel = (index: number) => bill.participants[index]?.name.trim() || `Orang ${index + 1}`;
  const setBill = (updater: (current: BillDraft) => BillDraft) => updateBill(updater);

  React.useLayoutEffect(() => {
    const id = pendingParticipantFocus.current;
    if (id && participantInputs.current.get(id)) {
      participantInputs.current.get(id)?.focus();
      pendingParticipantFocus.current = null;
    }
  }, [bill.participants]);

  function addParticipant(focusNew = false) {
    if (bill.participants.length >= MAX_PARTICIPANTS) return;
    const id = crypto.randomUUID();
    if (focusNew) pendingParticipantFocus.current = id;
    setBill((current) => ({ ...current, participants: [...current.participants, { id, name: "", quickAmount: 0 }] }));
  }

  function removeParticipant(id: string) {
    if (bill.participants.length <= 2) return;
    setBill((current) => ({
      ...current,
      participants: current.participants.filter((person) => person.id !== id),
      items: current.items.map((item) => ({ ...item, participantIds: item.participantIds.filter((ownerId) => ownerId !== id) })),
      payerId: current.payerId === id ? null : current.payerId,
    }));
  }

  function updateItem(id: string, updater: (item: BillItem) => BillItem) {
    setBill((current) => ({ ...current, items: current.items.map((item) => item.id === id ? updater(item) : item) }));
  }

  function addItem() {
    if (bill.items.length >= MAX_ITEMS) return;
    setBill((current) => ({
      ...current,
      items: [...current.items, { id: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, participantIds: current.participants[0] ? [current.participants[0].id] : [] }],
    }));
  }

  function showResult() {
    if (!result.canProceed) return;
    saveCurrentToRecent();
    router.push("/result");
  }

  const quickShareTotal = bill.participants.reduce((sum, person) => sum + (Number.isSafeInteger(person.quickAmount) ? person.quickAmount : 0), 0);

  return (
    <main className="min-h-svh pb-36">
      <SiteHeader step="01 / 03 · Input bill" />
      <div className="mx-auto max-w-[740px] px-5 pt-5 sm:px-8 sm:pt-10">
        <button type="button" className="mb-7 inline-flex items-center gap-2 text-xs font-bold text-[#687064] hover:text-[#171B16]" onClick={() => router.push("/")}><ArrowLeft className="size-4" /> Kembali ke beranda</button>
        <div className="mb-9"><div className="eyebrow text-[#70963C]">Satu bill, beres bareng</div><h1 className="mt-3 text-[clamp(2.3rem,7vw,3.7rem)] leading-[1.08] font-extrabold tracking-[-0.075em]">Bagi tagihannya.</h1><p className="mt-3 text-sm leading-6 font-medium text-[#687064]">Isi yang kamu tahu dulu. Angkanya langsung ikut berubah.</p></div>
        {storageError && <p role="status" className="mb-5 rounded-xl bg-[#FFF1EF] px-4 py-3 text-xs font-semibold text-[#A63127]">{storageError}</p>}

        <div className="space-y-5">
          <Card><CardContent>
            <label className="field-label" htmlFor="bill-title">Nama bill <span className="font-medium text-[#98A393]">(opsional)</span></label>
            <Input id="bill-title" value={bill.title} maxLength={60} placeholder="Contoh: Makan siang bareng" onChange={(event) => setBill((current) => ({ ...current, title: event.target.value }))} />
            <div className="mt-5"><div className="field-label">Cara bagi bill</div>
              <Tabs value={bill.mode} onValueChange={(mode) => setBill((current) => ({ ...current, mode: mode as BillDraft["mode"] }))}>
                <TabsList><TabsTrigger value="quick">Quick Split</TabsTrigger><TabsTrigger value="itemized">Detail per Item</TabsTrigger></TabsList>
                <TabsContent value="quick"><p className="mt-3 text-xs leading-5 font-medium text-[#8A9586]">Sudah tahu nominal dasar tiap orang? Langsung masukkan di bawah.</p></TabsContent>
                <TabsContent value="itemized"><p className="mt-3 text-xs leading-5 font-medium text-[#8A9586]">Masukkan pesanan satu per satu. Item sharing otomatis dibagi rata.</p></TabsContent>
              </Tabs>
            </div>
          </CardContent></Card>

          <Card><CardContent>
            <SectionHeading number="01" title="Siapa aja?" description={`Tambah 2–${MAX_PARTICIPANTS} orang. Tekan Enter untuk lanjut ke orang berikutnya.`} />
            <div className="space-y-3">
              {bill.participants.map((person, index) => (
                <div key={person.id} className="flex items-center gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EAF3DB] text-sm font-extrabold text-[#507528]">{String(index + 1).padStart(2, "0")}</span>
                  <Input ref={(element) => { if (element) participantInputs.current.set(person.id, element); else participantInputs.current.delete(person.id); }} aria-label={`Nama orang ${index + 1}`} value={person.name} maxLength={32} placeholder={`Nama orang ${index + 1}`} onChange={(event) => setBill((current) => ({ ...current, participants: current.participants.map((entry) => entry.id === person.id ? { ...entry, name: event.target.value } : entry) }))} onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                    event.preventDefault();
                    const nextPerson = bill.participants[index + 1];
                    if (nextPerson) participantInputs.current.get(nextPerson.id)?.focus();
                    else if (person.name.trim()) addParticipant(true);
                  }} />
                  <Button type="button" variant="ghost" size="icon" aria-label={`Hapus ${personLabel(index)}`} title="Hapus orang" disabled={bill.participants.length <= 2} onClick={() => removeParticipant(person.id)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
            <FieldErrors errors={result.errors} fields={["participants"]} />
            <Button type="button" variant="outline" className="mt-4 w-full border-dashed" disabled={bill.participants.length >= MAX_PARTICIPANTS} onClick={() => addParticipant(true)}><Plus className="size-4" /> Tambah orang</Button>
          </CardContent></Card>

          {bill.mode === "quick" ? (
            <Card><CardContent>
              <SectionHeading number="02" title="Nominal dasarnya" description="Sebelum diskon, pajak, dan service. Jumlah bagian harus sama dengan subtotal." />
              <label className="field-label" htmlFor="quick-subtotal">Subtotal sebelum diskon</label>
              <MoneyInput id="quick-subtotal" value={bill.quickSubtotal} onValueChange={(value) => setBill((current) => ({ ...current, quickSubtotal: value ?? 0 }))} />
              <div className="mt-5 space-y-3 border-t border-dashed border-[#DDE4D6] pt-5">
                {bill.participants.map((person, index) => <div key={person.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-3"><label htmlFor={`quick-${person.id}`} className="truncate text-xs font-bold">{personLabel(index)}</label><MoneyInput id={`quick-${person.id}`} value={person.quickAmount} onValueChange={(value) => setBill((current) => ({ ...current, participants: current.participants.map((entry) => entry.id === person.id ? { ...entry, quickAmount: value ?? 0 } : entry) }))} /></div>)}
              </div>
              <div className={`mt-5 flex flex-wrap justify-between gap-2 rounded-xl p-3 text-xs font-bold ${result.checks.quickDifference === 0 && bill.quickSubtotal > 0 ? "bg-[#EEF9DE] text-[#4C8126]" : "bg-[#FFF1EF] text-[#B13A30]"}`}>
                <span>Jumlah bagian {formatRupiah(quickShareTotal)}</span><span>{result.checks.quickDifference === 0 && bill.quickSubtotal > 0 ? "Sudah pas" : result.checks.quickDifference === null ? "Belum lengkap" : `${result.checks.quickDifference < 0 ? "Kurang" : "Lebih"} ${formatRupiah(Math.abs(result.checks.quickDifference))}`}</span>
              </div>
              <FieldErrors errors={result.errors} fields={["quick", "quick-check"]} />
            </CardContent></Card>
          ) : (
            <Card><CardContent>
              <SectionHeading number="02" title="Pesanannya" description="Harga per item dikali qty. Tap nama orang yang ikut menikmati item sharing." />
              <div className="space-y-4">
                {bill.items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-[20px] border border-[#E5E9DF] bg-[#FBFCF9] p-4">
                    <div className="flex items-center justify-between gap-3"><span className="eyebrow text-[#8A9586]">Item {String(itemIndex + 1).padStart(2, "0")}</span><Button type="button" variant="ghost" size="sm" className="text-[#A63127]" aria-label={`Hapus item ${itemIndex + 1}`} onClick={() => setBill((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }))}><Trash2 className="size-3.5" /> Hapus</Button></div>
                    <label className="field-label mt-3" htmlFor={`item-name-${item.id}`}>Nama pesanan</label>
                    <Input id={`item-name-${item.id}`} value={item.name} maxLength={60} placeholder="Contoh: Ayam geprek" onChange={(event) => updateItem(item.id, (current) => ({ ...current, name: event.target.value }))} />
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_82px] gap-3"><div><label className="field-label" htmlFor={`item-price-${item.id}`}>Harga / item</label><MoneyInput id={`item-price-${item.id}`} value={item.unitPrice} onValueChange={(value) => updateItem(item.id, (current) => ({ ...current, unitPrice: value ?? 0 }))} /></div><div><label className="field-label" htmlFor={`item-qty-${item.id}`}>Qty</label><Input id={`item-qty-${item.id}`} type="number" min={1} max={99} inputMode="numeric" value={item.quantity || ""} onChange={(event) => updateItem(item.id, (current) => ({ ...current, quantity: event.target.value ? Number(event.target.value) : 0 }))} /></div></div>
                    <div className="mt-4"><div className="field-label">Untuk siapa?</div><div className="flex flex-wrap gap-2">{bill.participants.map((person, index) => {
                      const selected = item.participantIds.includes(person.id);
                      return <button key={person.id} type="button" aria-pressed={selected} onClick={() => updateItem(item.id, (current) => ({ ...current, participantIds: selected ? current.participantIds.filter((id) => id !== person.id) : [...current.participantIds, person.id] }))} className={`min-h-10 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#739C24] ${selected ? "border-[#B4E15D] bg-[#C8F269] text-[#171B16]" : "border-[#DDE4D6] bg-white text-[#687064]"}`}>{selected && <Check className="mr-1 inline size-3" />}{personLabel(index)}</button>;
                    })}</div></div>
                    <div className="mt-4 flex justify-between border-t border-dashed border-[#DDE4D6] pt-3 text-xs font-bold"><span className="text-[#8A9586]">Jumlah item</span><span className="tabular-nums">{formatRupiah(item.unitPrice * item.quantity)}</span></div>
                  </div>
                ))}
              </div>
              <FieldErrors errors={result.errors} fields={["items"]} />
              <Button type="button" variant="outline" className="mt-4 w-full border-dashed" disabled={bill.items.length >= MAX_ITEMS} onClick={addItem}><Plus className="size-4" /> Tambah pesanan</Button>
              <div className="mt-5 flex items-center justify-between border-t border-[#E5E9DF] pt-4 text-sm font-bold"><span>Subtotal item</span><span className="tabular-nums">{formatRupiah(result.subtotal)}</span></div>
            </CardContent></Card>
          )}

          <Card><CardContent>
            <SectionHeading number="03" title="Biaya tambahan" description="Diskon dibagi proporsional. Pajak dan service dihitung dari subtotal sesudah diskon." />
            <div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor="discount">Diskon</label><MoneyInput id="discount" value={bill.discount} onValueChange={(value) => setBill((current) => ({ ...current, discount: value ?? 0 }))} /></div><ChargeField id="tax" label="Pajak" charge={bill.tax} onChange={(tax) => setBill((current) => ({ ...current, tax }))} /><ChargeField id="service" label="Service" charge={bill.service} onChange={(service) => setBill((current) => ({ ...current, service }))} /></div>
            <FieldErrors errors={result.errors} fields={["discount", "tax", "service", "charges"]} />
          </CardContent></Card>

          <Card><CardContent>
            <SectionHeading number="04" title="Siapa yang bayar?" description="Pilih satu orang yang sudah membayar seluruh bill. Hasil akan kasih angka transfer ke dia." />
            <div className="relative"><UsersRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#687064]" /><select value={bill.payerId ?? ""} onChange={(event) => setBill((current) => ({ ...current, payerId: event.target.value || null }))} aria-label="Siapa yang bayar" className="h-12 w-full appearance-none rounded-[14px] border border-[#DDE4D6] bg-white pr-4 pl-11 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#98C23E]"><option value="">Pilih yang bayar dulu</option>{bill.participants.map((person, index) => <option key={person.id} value={person.id}>{personLabel(index)}</option>)}</select></div>
            <FieldErrors errors={result.errors} fields={["payer"]} />
          </CardContent></Card>

          <Card><CardContent>
            <SectionHeading number="05" title="Cek total struk" description="Opsional, tapi berguna untuk memastikan angka hasil cocok dengan struk asli." />
            <div className="grid gap-4 sm:grid-cols-2">
              {bill.mode === "itemized" && <div><label className="field-label" htmlFor="expected-subtotal">Subtotal di struk</label><MoneyInput id="expected-subtotal" value={bill.expectedSubtotal} placeholder="Boleh dikosongkan" onValueChange={(value) => setBill((current) => ({ ...current, expectedSubtotal: value }))} /></div>}
              <div><label className="field-label" htmlFor="expected-total">Total akhir di struk</label><MoneyInput id="expected-total" value={bill.expectedTotal} placeholder="Boleh dikosongkan" onValueChange={(value) => setBill((current) => ({ ...current, expectedTotal: value }))} /></div>
            </div>
            <div className="mt-4">
              {bill.mode === "itemized" && bill.expectedSubtotal !== null && result.checks.subtotalDifference !== null && <Difference label="Subtotal" actual={result.subtotal} expected={bill.expectedSubtotal} difference={result.checks.subtotalDifference} />}
              {bill.expectedTotal !== null && result.checks.totalDifference !== null && <Difference label="Total akhir" actual={result.total} expected={bill.expectedTotal} difference={result.checks.totalDifference} />}
            </div>
            <FieldErrors errors={result.errors} fields={["subtotal-check", "total-check"]} />
          </CardContent></Card>

          <Card className="border-[#D8E8BE] bg-[#F3F9E9]"><CardContent>
            <div className="flex items-center justify-between gap-3"><div><div className="eyebrow text-[#70963C]">Live preview</div><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em]">Bagian sementara</h2></div><span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#687064]">{result.canProceed ? "Siap" : "Belum final"}</span></div>
            <div className="mt-4 divide-y divide-[#DDEACB]">{result.people.map((person, index) => <div key={person.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate font-semibold">{person.name || `Orang ${index + 1}`}</span><span className="shrink-0 font-extrabold tabular-nums">{formatRupiah(person.total)}</span></div>)}</div>
            <p className="mt-2 text-xs leading-5 font-medium text-[#687064]">Angka ini mengikuti input langsung. Hasil baru bisa dibuka saat semua isian dan cek bill sudah cocok.</p>
          </CardContent></Card>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-[#DFE6D8] bg-[#F8F9F3]/95 px-5 py-3 backdrop-blur-xl sm:px-8 sm:py-4" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-[680px] items-center gap-4"><div className="min-w-0 flex-1"><div aria-live="polite" className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.07em] text-[#687064] uppercase">{result.canProceed ? <Check className="size-3.5 text-[#4C8126]" /> : <CircleAlert className="size-3.5 text-[#B13A30]" />}{result.canProceed ? bill.expectedTotal !== null || (bill.mode === "itemized" && bill.expectedSubtotal !== null) ? "Cocok dengan struk" : "Perhitungan siap" : result.errors[0]?.message || "Lengkapi bill"}</div><div className="mt-1 truncate text-xl font-extrabold tracking-[-0.06em] tabular-nums sm:text-2xl">{result.subtotal > 0 ? formatRupiah(result.total) : "Rp—"}</div></div><Button type="button" size="lg" className="shrink-0" disabled={!hydrated || !result.canProceed} onClick={showResult}>Lihat Hasil <ArrowRight className="size-4" /></Button></div>
      </div>
    </main>
  );
}
