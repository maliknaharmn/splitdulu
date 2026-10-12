import { cn } from "@/lib/utils";

export function BrandMark({ className, mono = false, primary = false }: { className?: string; mono?: boolean; primary?: boolean }) {
  return (
    <svg viewBox="-5 -5 130 160" className={cn("h-11 w-9 shrink-0 overflow-visible", className)} aria-hidden="true">
      <path fill={mono ? "currentColor" : primary ? "#B8E944" : "#171B16"} d="M49 1h44c17 0 26 9 26 23 0 15-9 23-25 23H59c-11 0-16-5-16-13 0-9-5-14-13-14-9 0-15 8-15 18 0 14 13 21 37 28l25 7c28 8 43 21 43 43 0 22-19 34-47 34H25C9 150 0 142 0 128c0-14 9-23 24-23h37c-1 17 5 26 16 26 10 0 16-7 16-16 0-10-8-16-25-21l-27-8C13 78 0 63 0 43 0 18 21 1 49 1Z" />
      {!mono && !primary && <path fill="#C8F269" d="M0 128c0-14 9-23 24-23h37c-1 17 5 26 16 26 10 0 16-7 16-16 0-4-1-7-4-10 20 9 31 22 31 36 0 5-1 7-3 9H25C9 150 0 142 0 128Z" />}
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[#171B16] sm:gap-3", className)}>
      <BrandMark primary className="h-11 w-9 sm:h-12 sm:w-10" />
      <span className="text-[22px] leading-none font-bold tracking-[-0.075em] sm:text-[26px]">Split<span className="font-extrabold">Dulu</span></span>
    </span>
  );
}
