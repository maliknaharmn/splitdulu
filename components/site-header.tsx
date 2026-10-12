import Link from "next/link";
import { ArrowUpRight, Coffee } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export function SiteHeader({ step }: { step?: string }) {
  return (
    <header className="relative mx-auto flex w-full max-w-6xl flex-col items-start px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-5 lg:py-6">
      <div className="flex flex-col gap-2 lg:shrink-0">
        <Link href="/" aria-label="SplitDulu, ke beranda" className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#739C24] focus-visible:ring-offset-2"><Brand /></Link>
        <p className="flex min-h-11 items-center whitespace-nowrap text-[10px] font-semibold text-[#687064] sm:text-xs lg:min-h-0">
          a project by <a href="https://www.instagram.com/malikismee/" target="_blank" rel="noopener noreferrer" className="ml-1 rounded-sm font-bold text-[#171B16] underline decoration-[#9FC949] underline-offset-2 outline-none hover:decoration-2 focus-visible:ring-2 focus-visible:ring-[#739C24]">Malik N</a>
        </p>
      </div>
      <div className="contents lg:flex lg:items-center lg:gap-5">
        {step && <span className="absolute top-5 right-5 shrink-0 rounded-full border border-[#E2E8DC] bg-white px-3 py-2 text-[11px] font-bold tracking-[0.12em] text-[#687064] uppercase sm:right-8 lg:static"><span className="sm:hidden">{step.split("·")[0].trim()}</span><span className="hidden sm:inline">{step}</span></span>}
        <Button asChild variant="lime" size="sm" className="absolute right-5 bottom-5 min-h-11 px-3 text-[11px] sm:right-8 sm:px-4 sm:text-xs lg:static">
          <a href="https://trakteer.id/malikisme/tip" target="_blank" rel="noopener noreferrer"><Coffee className="size-4" aria-hidden="true" /> Buy me a coffee <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>
        </Button>
      </div>
    </header>
  );
}
