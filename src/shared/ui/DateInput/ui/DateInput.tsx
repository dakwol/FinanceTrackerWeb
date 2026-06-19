import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { Input } from "@/shared/ui/Input";

interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(props, ref) {
    return <Input ref={ref} type="date" {...props} />;
  },
);
