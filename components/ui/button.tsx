import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#739C24] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-[#171B16] text-white hover:bg-[#30392C]",
        lime: "bg-[#C8F269] text-[#171B16] hover:bg-[#B6E356]",
        outline: "border border-[#DDE4D6] bg-white text-[#171B16] hover:bg-[#F4F7EF]",
        ghost: "text-[#171B16] hover:bg-[#EDF2E7]",
        destructive: "bg-[#FFF1EF] text-[#A63127] hover:bg-[#FFE3DE]",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "min-h-9 rounded-xl px-3 text-xs",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
