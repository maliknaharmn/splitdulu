"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatInputMoney, formatPercentInput, parsePercentInput, parseRupiahInput } from "@/lib/format";

type MoneyInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

export function MoneyInput({ value, onValueChange, ...props }: MoneyInputProps) {
  const [text, setText] = React.useState(() => formatInputMoney(value));
  const [focused, setFocused] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-[#687064]">Rp</span>
        <Input
          {...props}
          value={focused ? text : formatInputMoney(value)}
          inputMode="numeric"
          className={`pl-11 tabular-nums ${props.className || ""}`}
          aria-invalid={invalid || props["aria-invalid"]}
          onFocus={(event) => { setFocused(true); setText(value === 0 ? "" : formatInputMoney(value)); props.onFocus?.(event); }}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (!raw.trim()) {
              setInvalid(false);
              onValueChange(value === null ? null : 0);
              return;
            }
            const parsed = parseRupiahInput(raw);
            setInvalid(parsed === null);
            if (parsed !== null) onValueChange(parsed);
          }}
          onBlur={(event) => { setFocused(false); setInvalid(false); props.onBlur?.(event); }}
        />
      </div>
      {invalid && <p className="mt-1 text-xs font-semibold text-[#B13A30]">Pakai angka rupiah, misalnya 31000 atau 31k.</p>}
    </div>
  );
}

type PercentInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function PercentInput({ value, onValueChange, ...props }: PercentInputProps) {
  const [text, setText] = React.useState(() => formatPercentInput(value));
  const [focused, setFocused] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);

  return (
    <div>
      <div className="relative">
        <Input
          {...props}
          value={focused ? text : formatPercentInput(value)}
          inputMode="decimal"
          className={`pr-10 tabular-nums ${props.className || ""}`}
          aria-invalid={invalid || props["aria-invalid"]}
          onFocus={(event) => { setFocused(true); setText(value === 0 ? "" : formatPercentInput(value)); props.onFocus?.(event); }}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (!raw.trim()) { setInvalid(false); onValueChange(0); return; }
            const parsed = parsePercentInput(raw);
            setInvalid(parsed === null);
            if (parsed !== null) onValueChange(parsed);
          }}
          onBlur={(event) => { setFocused(false); setInvalid(false); props.onBlur?.(event); }}
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-[#687064]">%</span>
      </div>
      {invalid && <p className="mt-1 text-xs font-semibold text-[#B13A30]">Pakai persen 0–100, maksimal dua desimal.</p>}
    </div>
  );
}
