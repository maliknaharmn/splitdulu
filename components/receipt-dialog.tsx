"use client";

import * as React from "react";
import Image from "next/image";
import { Download, LoaderCircle, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillCalculation, BillDraft } from "@/lib/bill";
import { downloadReceipt, receiptFileName, renderReceipt, shareReceipt, type ReceiptSelection, type RenderedReceipt } from "@/lib/receipt";

function ReceiptContent({ bill, result, selection }: { bill: BillDraft; result: BillCalculation; selection: ReceiptSelection }) {
  const [receipt, setReceipt] = React.useState<(RenderedReceipt & { url: string }) | null>(null);
  const [sharing, setSharing] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const name = selection === "full" ? "Semua orang" : result.people.find((person) => person.id === selection)?.name || "Personal";

  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    renderReceipt(bill, result, selection).then((generated) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(generated.blob);
      setReceipt({ ...generated, url: objectUrl });
    }).catch((caught: unknown) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "Gambar struk gagal dibuat.");
    });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [bill, result, selection]);

  const fileName = receiptFileName(bill, result, selection);

  async function handleShare() {
    if (!receipt || sharing) return;
    setStatus("");
    setSharing(true);
    try {
      const outcome = await shareReceipt(receipt.blob, fileName);
      if (outcome === "shared") setStatus("Struk siap dibagikan.");
      if (outcome === "downloaded") setStatus("Share gambar belum didukung. PNG sudah diunduh.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Gambar gagal dibagikan.");
    } finally {
      setSharing(false);
    }
  }

  function handleDownload() {
    if (!receipt) return;
    try {
      downloadReceipt(receipt.blob, fileName);
      setStatus("PNG sudah diunduh.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Gambar gagal diunduh.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6">
      <div role="region" aria-label="Pratinjau struk, gulir untuk melihat seluruh isi" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[18px] bg-[#E9ECE3] shadow-[0_18px_50px_rgba(23,27,22,.14)] focus-visible:outline-2 focus-visible:outline-[#739C24]">
        {receipt ? <Image src={receipt.url} alt={`Pratinjau struk ${name}`} width={receipt.width} height={receipt.height} unoptimized className="mx-auto h-auto w-full max-w-[390px]" /> : <div role={error ? "alert" : "status"} className="flex min-h-64 items-center justify-center px-4 text-center text-sm font-semibold text-[#687064]">{error || <><LoaderCircle className="mr-2 size-4 animate-spin" /> Membuat struk...</>}</div>}
      </div>
      <div className="mt-5 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2"><Button type="button" variant="outline" disabled={!receipt} onClick={handleDownload}><Download className="size-4" /> Download PNG</Button><Button type="button" variant="lime" disabled={!receipt || sharing} onClick={handleShare}>{sharing ? <LoaderCircle className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share gambar</Button></div>
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
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="receipt-dialog-title" className="receipt-dialog w-[min(560px,calc(100vw-24px))] max-h-[94svh] overflow-hidden rounded-[28px] bg-[#F8F9F3] p-0 shadow-[0_30px_90px_rgba(14,22,11,.3)] open:flex open:flex-col">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-[#E0E6DA] bg-[#F8F9F3]/95 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div><div className="eyebrow text-[#799246]">Struk siap kirim</div><h2 id="receipt-dialog-title" className="mt-1 text-lg font-extrabold tracking-[-0.05em]">{name}</h2></div>
        <Button type="button" size="icon" variant="ghost" aria-label="Tutup pratinjau struk" onClick={onClose}><X className="size-5" /></Button>
      </div>
      {selection !== null && <ReceiptContent key={`${selection}-${bill.updatedAt}`} bill={bill} result={result} selection={selection} />}
    </dialog>
  );
}
