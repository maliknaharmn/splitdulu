import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full min-w-0 rounded-[14px] border border-[#DDE4D6] bg-white px-4 py-2 text-sm font-medium text-[#171B16] outline-none transition-colors placeholder:text-[#9AA496] focus-visible:border-[#98C23E] focus-visible:ring-2 focus-visible:ring-[#C8F269]/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
