"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { Input } from "@/shared/ui/Input";

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode"> {
  label?: string;
  error?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(props, ref) {
    return (
      <Input
        inputMode="decimal"
        placeholder="0 ₽"
        ref={ref}
        type="text"
        {...props}
      />
    );
  },
);
