"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown, Copy, ReceiptText, Share2 } from "lucide-react";

import { ReceiptDialog } from "@/components/receipt-dialog";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { billTitle, calculateBill } from "@/lib/bill";
import { buildWhatsAppText, formatRupiah } from "@/lib/format";
import { useBill } from "@/providers/bill-provider";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Teks belum berhasil disalin.");
}

export default function ResultPage() {
  const router = useRouter();
  const { bill, hydrated } = useBill();
  const result = React.useMemo(() => calculateBill(bill), [bill]);
  const [selection, setSelection] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState("");
  const payer = result.people.find((person) => person.id === bill.payerId);

  React.useEffect(() => {
    if (hydrated && !result.canProceed) router.replace("/split");
  }, [hydrated, result.canProceed, router]);

  async function handleCopy() {
    try {
      await copyText(buildWhatsAppText(bill, result));
      setCopyStatus("Hasil disalin. Tinggal paste ke WhatsApp.");
    } catch {
      setCopyStatus("Tidak bisa menyalin otomatis. Coba lagi dari browser yang mendukung clipboard.");
    }
  }

  if (!hydrated || !result.canProceed) {
    return <main className="min-h-svh"><SiteHeader step="02 / 03 · Hasil" /><div className="mx-auto max-w-[740px] px-5 py-20 text-sm font-semibold text-[#687064]">Menyiapkan hasil bill...</div></main>;
  }

  return (
    <main className="min-h-svh pb-20">
      <SiteHeader step="02 / 03 · Hasil" />
      <div className="mx-auto max-w-[740px] px-5 pt-5 sm:px-8 sm:pt-10">
        <button type="button" className="mb-7 inline-flex items-center gap-2 text-xs font-bold text-[#687064] hover:text-[#171B16]" onClick={() => router.push("/split")}><ArrowLeft className="size-4" /> Edit bill</button>

        <div className="relative overflow-hidden rounded-[30px] bg-[#C8F269] p-6 sm:p-8">
          <div className="absolute -top-24 -right-16 size-60 rounded-full border-[32px] border-[#B2DF52]/50" aria-hidden="true" />
          <div className="relative z-10"><div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-[10px] font-extrabold tracking-[0.1em] uppercase"><Check className="size-3.5" /> Bill sudah terbagi</div><h1 className="mt-6 max-w-[530px] break-words text-[clamp(2rem,6vw,3.5rem)] leading-[1.08] font-extrabold tracking-[-0.07em]">{billTitle(bill)}</h1><div className="mt-7 text-xs font-bold text-[#466623]">Total yang dibayar</div><div className="mt-1 break-all text-[clamp(2.5rem,8vw,4.5rem)] leading-none font-extrabold tracking-[-0.08em] tabular-nums">{formatRupiah(result.total)}</div><div className="mt-5 text-xs font-semibold text-[#466623]">{result.people.length} orang · Semua angka pas sampai rupiah terakhir</div></div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-[#E5E9DF] bg-white p-4"><div className="text-[11px] font-semibold text-[#8A9586]">Subtotal</div><div className="mt-1 font-extrabold tabular-nums">{formatRupiah(result.subtotal)}</div></div>
          <div className="rounded-[20px] border border-[#E5E9DF] bg-white p-4"><div className="text-[11px] font-semibold text-[#8A9586]">Diskon</div><div className="mt-1 font-extrabold tabular-nums">−{formatRupiah(result.discount)}</div></div>
          <div className="rounded-[20px] border border-[#E5E9DF] bg-white p-4"><div className="text-[11px] font-semibold text-[#8A9586]">Pajak + Service</div><div className="mt-1 font-extrabold tabular-nums">{formatRupiah(result.tax + result.service)}</div></div>
        </div>

        <div className="mt-9 mb-4 flex items-end justify-between"><div><div className="eyebrow text-[#799246]">Rincian</div><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.055em]">Bagian tiap orang</h2></div></div>
        <div className="space-y-3">
          {result.people.map((person, index) => (
            <Card key={person.id}><CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBE7F7] text-xs font-extrabold text-[#4F4774]">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="break-words text-sm font-extrabold">{person.name}</div>{person.id === bill.payerId && <span className="mt-1 inline-block rounded-full bg-[#EAF7D2] px-2 py-1 text-[10px] font-bold text-[#4C8126]">Bayar dulu</span>}</div><div className="text-right text-xl font-extrabold tracking-[-0.05em] tabular-nums">{formatRupiah(person.total)}</div></div></div></div>
              <details className="group mt-4 border-t border-[#E5E9DF] pt-3"><summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-[#687064]">Lihat rincian <ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary><div className="mt-4 space-y-2 text-xs font-medium">
                {bill.mode === "itemized" && person.itemShares.map((item) => <div key={item.itemId} className="flex justify-between gap-4"><span className="min-w-0 break-words text-[#687064]">{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}</span><span className="shrink-0 font-semibold tabular-nums">{formatRupiah(item.amount)}</span></div>)}
                <div className="flex justify-between"><span className="text-[#687064]">Subtotal bagian</span><span className="font-semibold tabular-nums">{formatRupiah(person.gross)}</span></div>
                <div className="flex justify-between"><span className="text-[#687064]">Diskon</span><span className="font-semibold tabular-nums">−{formatRupiah(person.discount)}</span></div>
                <div className="flex justify-between"><span className="text-[#687064]">Pajak</span><span className="font-semibold tabular-nums">{formatRupiah(person.tax)}</span></div>
                <div className="flex justify-between"><span className="text-[#687064]">Service</span><span className="font-semibold tabular-nums">{formatRupiah(person.service)}</span></div>
              </div></details>
              <Button type="button" size="sm" variant="ghost" className="mt-2 px-0 text-[#4C8126] hover:bg-transparent" onClick={() => setSelection(person.id)}><ReceiptText className="size-4" /> Lihat struk {person.name} <ArrowRight className="size-3.5" /></Button>
            </CardContent></Card>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[26px] bg-[#171B16] p-5 text-white sm:p-7">
          <div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-[#C8F269] text-[#171B16]"><CheckCheck className="size-5" /></span><div><div className="eyebrow text-[#C8F269]">Who paid?</div><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em]">Transfer ke {payer?.name}</h2></div></div>
          <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
            {result.settlements.length ? result.settlements.map((settlement) => <div key={settlement.fromId} className="flex items-center justify-between gap-4 py-4 text-sm"><span className="min-w-0 break-words font-medium text-[#DCE5D8]">{settlement.fromName} <ArrowRight className="mx-1 inline size-3.5" /> {settlement.toName}</span><span className="shrink-0 font-extrabold tabular-nums">{formatRupiah(settlement.amount)}</span></div>) : <p className="py-5 text-sm font-medium text-[#DCE5D8]">Tidak ada transfer yang perlu dilakukan.</p>}
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#DEE5D8] bg-white p-5 sm:p-6"><div className="eyebrow text-[#799246]">Bagikan hasilnya</div><h2 className="mt-2 text-xl font-extrabold tracking-[-0.05em]">Tinggal kirim ke grup.</h2><p className="mt-2 text-xs leading-5 font-medium text-[#8A9586]">Copy teks untuk chat, atau kirim struk gambar dengan watermark kecil SplitDulu.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button type="button" size="lg" onClick={handleCopy}><Copy className="size-4" /> Copy untuk WhatsApp</Button><Button type="button" size="lg" variant="outline" onClick={() => setSelection("full")}><Share2 className="size-4" /> Struk semua orang</Button></div>{copyStatus && <p role="status" className="mt-3 text-xs font-semibold text-[#4C8126]">{copyStatus}</p>}</div>

        <div className="mt-7 flex flex-wrap justify-center gap-4 text-xs font-bold"><button type="button" className="text-[#687064] underline underline-offset-4 hover:text-[#171B16]" onClick={() => router.push("/split")}>Perlu edit? Kembali ke bill</button><button type="button" className="text-[#687064] underline underline-offset-4 hover:text-[#171B16]" onClick={() => router.push("/")}>Kembali ke beranda</button></div>
      </div>
      <ReceiptDialog bill={bill} result={result} selection={selection} onClose={() => setSelection(null)} />
    </main>
  );
}
