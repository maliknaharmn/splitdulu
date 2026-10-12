"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, LoaderCircle, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillCalculation, BillDraft } from "@/lib/bill";
import { downloadReceipt, downloadReceiptPages, receiptFileName, renderReceiptPages, shareReceiptPages, type ReceiptSelection } from "@/lib/receipt";

function ReceiptContent({ bill, result, selection }: { bill: BillDraft; result: BillCalculation; selection: ReceiptSelection }) {
  const [pages, setPages] = React.useState<{ blob: Blob; url: string }[]>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const name = selection === "full" ? "Semua orang" : result.people.find((person) => person.id === selection)?.name || "Personal";

  React.useEffect(() => {
    let cancelled = false;
    let objectUrls: string[] = [];
    renderReceiptPages(bill, result, selection).then((generated) => {
      if (cancelled) return;
      objectUrls = generated.map((blob) => URL.createObjectURL(blob));
      setPages(generated.map((blob, index) => ({ blob, url: objectUrls[index] })));
    }).catch((caught: unknown) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "Gambar struk gagal dibuat.");
    });
    return () => { cancelled = true; objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [bill, result, selection]);

  const fileNames = pages.map((_, index) => receiptFileName(bill, result, selection, pages.length > 1 ? index + 1 : undefined));
  const archiveName = receiptFileName(bill, result, selection).replace(/\.png$/, "-semua-halaman.zip");

  async function handleShare() {
    if (!pages.length) return;
    setStatus("");
    try {
      const outcome = await shareReceiptPages(pages.map((page) => page.blob), fileNames, archiveName);
      if (outcome === "shared") setStatus("Semua halaman siap dibagikan.");
      if (outcome === "downloaded") setStatus(pages.length > 1 ? "Share semua gambar belum didukung. ZIP berisi seluruh PNG sudah diunduh." : "Share gambar belum didukung. PNG sudah diunduh.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Gambar gagal dibagikan.");
    }
  }

  function handleDownloadPage() {
    const page = pages[pageIndex];
    if (!page) return;
    downloadReceipt(page.blob, fileNames[pageIndex]);
    setStatus(`PNG halaman ${pageIndex + 1} sudah diunduh.`);
  }

  async function handleDownloadAll() {
    if (!pages.length) return;
    setStatus("");
    try {
      await downloadReceiptPages(pages.map((page) => page.blob), fileNames, archiveName);
      setStatus(pages.length > 1 ? "ZIP berisi seluruh PNG sudah diunduh." : "PNG sudah diunduh.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Gambar gagal diunduh.");
    }
  }

  return (
    <div className="px-5 py-5 sm:px-6">
      {pages.length > 1 && <div className="mb-4 flex items-center justify-center gap-4"><Button type="button" variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={pageIndex === 0} onClick={() => setPageIndex((current) => current - 1)}><ChevronLeft className="size-4" /></Button><span className="min-w-24 text-center text-xs font-bold tabular-nums">Halaman {pageIndex + 1} / {pages.length}</span><Button type="button" variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={pageIndex === pages.length - 1} onClick={() => setPageIndex((current) => current + 1)}><ChevronRight className="size-4" /></Button></div>}
      <div className="mx-auto aspect-[4/5] w-full max-w-[390px] overflow-hidden rounded-[18px] bg-[#E9ECE3] shadow-[0_18px_50px_rgba(23,27,22,.14)]">
        {pages[pageIndex] ? <Image src={pages[pageIndex].url} alt={`Pratinjau struk ${name} halaman ${pageIndex + 1} dari ${pages.length}`} width={1080} height={1350} unoptimized className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-[#687064]">{error || <><LoaderCircle className="mr-2 size-4 animate-spin" /> Membuat struk...</>}</div>}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><Button type="button" variant="outline" disabled={!pages.length} onClick={handleDownloadPage}><Download className="size-4" /> {pages.length > 1 ? "PNG halaman ini" : "Download PNG"}</Button><Button type="button" variant="lime" disabled={!pages.length} onClick={handleShare}><Share2 className="size-4" /> {pages.length > 1 ? "Share semua" : "Share gambar"}</Button></div>
      {pages.length > 1 && <Button type="button" variant="outline" className="mt-3 w-full" aria-label="Download semua PNG sebagai ZIP" onClick={handleDownloadAll}><Download className="size-4" /> Download semua (.zip)</Button>}
      <p className="mt-3 text-center text-xs font-medium text-[#8A9586]">{pages.length > 1 ? "Setiap halaman" : "Ukuran"} 1080 × 1350 px · Watermark SplitDulu tertanam di gambar.</p>
      {status && <p role="status" className="mt-3 rounded-xl bg-white px-4 py-3 text-center text-xs font-semibold text-[#485144]">{status}</p>}
    </div>
  );
}

export function ReceiptDialog({ bill, result, selection, onClose }: { bill: BillDraft; result: BillCalculation; selection: ReceiptSelection | null; onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selection !== null && !dialog.open) dialog.showModal();
    if (selection === null && dialog.open) dialog.close();
  }, [selection]);

  const name = selection === "full" ? "Semua orang" : result.people.find((person) => person.id === selection)?.name || "Personal";

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="receipt-dialog-title" className="receipt-dialog w-[min(560px,calc(100vw-24px))] max-h-[94svh] rounded-[28px] bg-[#F8F9F3] p-0 shadow-[0_30px_90px_rgba(14,22,11,.3)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E0E6DA] bg-[#F8F9F3]/95 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div><div className="eyebrow text-[#799246]">Struk siap kirim</div><h2 id="receipt-dialog-title" className="mt-1 text-lg font-extrabold tracking-[-0.05em]">{name}</h2></div>
        <Button type="button" size="icon" variant="ghost" aria-label="Tutup pratinjau struk" onClick={onClose}><X className="size-5" /></Button>
      </div>
      {selection !== null && <ReceiptContent key={`${selection}-${bill.updatedAt}`} bill={bill} result={result} selection={selection} />}
    </dialog>
  );
}
