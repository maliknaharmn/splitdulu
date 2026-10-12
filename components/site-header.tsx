import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Brand } from "@/components/brand";

export function SiteHeader({ step }: { step?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/" aria-label="SplitDulu, ke beranda"><Brand /></Link>
      {step ? <span className="shrink-0 rounded-full border border-[#E2E8DC] bg-white px-3 py-2 text-[11px] font-bold tracking-[0.12em] text-[#687064] uppercase"><span className="sm:hidden">{step.split("·")[0].trim()}</span><span className="hidden sm:inline">{step}</span></span> :
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-[#687064] sm:inline-flex"><LockKeyhole className="size-3.5" /> Data tetap di browsermu</span>}
    </header>
  );
}
