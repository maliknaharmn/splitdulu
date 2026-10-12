"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { billTitle, calculateBill } from "@/lib/bill";
import { formatDate, formatRupiah } from "@/lib/format";
import { useBill } from "@/providers/bill-provider";

export default function HomePage() {
  const router = useRouter();
  const { recent, hydrated, storageError, startNewBill, loadRecent, clearRecent } = useBill();

  function begin() {
    startNewBill();
    router.push("/split");
  }

  return (
    <main className="min-h-svh overflow-hidden">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#DCE8C9] bg-[#F0F8DF] px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-[#43601E] uppercase">
            <span className="size-2 rounded-full bg-[#9FC949]" /> Bagi bill, lanjut ngobrol
          </div>
          <h1 className="max-w-[700px] text-[clamp(3.1rem,8vw,6.6rem)] leading-[1.02] font-extrabold tracking-[-0.085em]">
            Split bill <span className="relative inline-block whitespace-nowrap"><span className="relative z-10">tanpa ribet.</span><span className="absolute right-[-2%] bottom-[3%] left-[-2%] h-[22%] -rotate-2 rounded-full bg-[#C8F269]" /></span>
          </h1>
          <p className="mt-7 max-w-[570px] text-base leading-8 font-medium text-[#687064] sm:text-lg">
            Pesanan beda-beda, ada yang sharing, diskon, pajak, service? Masukin bill-nya. Sisanya biar kami yang hitung sampai rupiah terakhir.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="w-full sm:w-auto" onClick={begin}>Mulai Split <ArrowRight className="size-4" /></Button>
            <span className="text-center text-xs font-semibold text-[#8A9586] sm:ml-2 sm:text-left">Gratis · Tanpa login · Langsung jalan</span>
          </div>
          <div className="mt-11 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#E1E7DC] pt-6 text-xs font-semibold text-[#687064]">
            <span>01&nbsp; Pilih mode</span><span>02&nbsp; Isi bill</span><span>03&nbsp; Kirim hasil</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[470px] lg:max-w-none" aria-hidden="true">
          <div className="absolute -top-12 -right-12 size-64 rounded-full bg-[#DBF6A1] blur-2xl sm:size-80" />
          <div className="absolute -bottom-10 -left-10 size-36 rotate-12 rounded-[38px] bg-[#EBE7F7]" />
          <div className="relative rotate-[2deg] rounded-[32px] border border-[#E0E7D9] bg-white p-5 shadow-[0_28px_80px_rgba(24,37,20,.12)] sm:p-8">
            <div className="flex items-center justify-between border-b border-dashed border-[#DAE1D3] pb-6">
              <div><div className="eyebrow text-[#8A9586]">Bill bareng</div><div className="mt-2 text-xl font-extrabold tracking-[-0.05em]">Makan siang</div></div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#C8F269]"><Sparkles className="size-5" /></span>
            </div>
            <div className="space-y-4 py-7 text-sm font-semibold">
              <div className="flex justify-between"><span className="text-[#687064]">Malik</span><span className="tabular-nums">Rp42.350</span></div>
              <div className="flex justify-between"><span className="text-[#687064]">Fadel</span><span className="tabular-nums">Rp55.150</span></div>
              <div className="flex justify-between"><span className="text-[#687064]">Adit</span><span className="tabular-nums">Rp40.000</span></div>
            </div>
            <div className="rounded-[22px] bg-[#171B16] p-5 text-white">
              <div className="eyebrow text-[#C8F269]">Semua sudah kebagi</div>
              <div className="mt-2 text-[clamp(2.1rem,6vw,3rem)] font-extrabold tracking-[-0.07em] tabular-nums">Rp137.500</div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#C8D0C6]">Siap di-copy atau dibagikan <ArrowUpRight className="size-4" /></div>
            </div>
            <div className="mt-5 text-center text-[10px] font-bold tracking-[0.15em] text-[#A9B2A4] uppercase">split with SplitDulu</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#E1E7DC] pt-9">
          <div><div className="eyebrow text-[#799246]">Lanjutkan</div><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.06em]">Bill terbaru</h2></div>
          {recent.length > 0 && <button type="button" className="text-xs font-bold text-[#687064] underline underline-offset-4 hover:text-[#171B16]" onClick={clearRecent}>Hapus riwayat</button>}
        </div>
        {storageError && <p role="status" className="mt-5 rounded-xl bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#A63127]">{storageError}</p>}
        {hydrated && recent.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <button key={entry.id} type="button" className="text-left" onClick={() => { loadRecent(entry.id); router.push("/result"); }}>
                <Card className="h-full transition-transform hover:-translate-y-1 hover:border-[#BDD98F]"><CardContent>
                  <div className="flex items-start justify-between"><Clock3 className="size-4 text-[#8AA174]" /><ArrowUpRight className="size-4 text-[#687064]" /></div>
                  <div className="mt-5 truncate text-lg font-extrabold tracking-[-0.05em]">{billTitle(entry)}</div>
                  <div className="mt-1 text-xs font-medium text-[#8A9586]">{formatDate(entry.updatedAt)} · {entry.participants.length} orang</div>
                  <div className="mt-5 text-xl font-extrabold tracking-[-0.05em] tabular-nums">{formatRupiah(calculateBill(entry).total)}</div>
                </CardContent></Card>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-dashed border-[#D6DFCF] bg-white/50 p-5 text-sm font-medium text-[#687064]"><LockKeyhole className="size-5 shrink-0 text-[#8AA174]" /> {hydrated ? "Belum ada bill tersimpan. Hasil pertamamu akan muncul di sini." : "Memuat bill dari browser ini..."}</div>
        )}
        <p className="mt-4 text-xs font-medium text-[#8A9586]">Bill tersimpan hanya di browser ini. Hapus data browser berarti riwayat ikut terhapus.</p>
      </section>
    </main>
  );
}
